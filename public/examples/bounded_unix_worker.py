#!/usr/bin/env python3
"""Bounded Unix-domain worker demo using only synthetic integer requests.

This is a teaching example, not a production RPC protocol. Linux is required
because it uses AF_UNIX + SOCK_SEQPACKET to preserve message boundaries.
"""

from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import os
from pathlib import Path
import socket
import tempfile
import time
from typing import Any


MAX_PACKET = 4096


def send_json(sock: socket.socket, message: dict[str, Any]) -> None:
    payload = json.dumps(message, separators=(",", ":")).encode("utf-8")
    if len(payload) > MAX_PACKET:
        raise ValueError("message exceeds MAX_PACKET")
    sent = sock.send(payload)
    if sent != len(payload):
        raise RuntimeError("short SOCK_SEQPACKET send")


def recv_json(sock: socket.socket) -> dict[str, Any]:
    payload = sock.recv(MAX_PACKET + 1)
    if not payload:
        raise EOFError("peer closed the socket")
    if len(payload) > MAX_PACKET:
        raise ValueError("message exceeds MAX_PACKET")
    message = json.loads(payload.decode("utf-8"))
    if not isinstance(message, dict):
        raise ValueError("message must be a JSON object")
    return message


def serve(socket_path: Path) -> None:
    # Stand in for one-time model/runtime initialization.
    runtime = {"protocol": 1, "pid": os.getpid()}
    socket_path.unlink(missing_ok=True)

    try:
        with socket.socket(socket.AF_UNIX, socket.SOCK_SEQPACKET) as server:
            server.bind(str(socket_path))
            server.listen(1)  # Deliberately bounded: one connected client.

            connection, _ = server.accept()
            with connection:
                send_json(connection, {"type": "ready", **runtime})
                while True:
                    request = recv_json(connection)
                    request_id = request.get("request_id")
                    if request.get("type") == "stop":
                        send_json(connection, {"type": "stopped", "request_id": request_id})
                        break

                    if request.get("type") != "infer" or not isinstance(request_id, str):
                        send_json(connection, {
                            "type": "error",
                            "request_id": request_id,
                            "code": "BAD_REQUEST",
                        })
                        continue

                    now = time.monotonic_ns()
                    if now > int(request.get("deadline_ns", 0)):
                        send_json(connection, {
                            "type": "rejected",
                            "request_id": request_id,
                            "code": "DEADLINE_EXPIRED",
                        })
                        continue

                    value = request.get("value")
                    if not isinstance(value, int):
                        send_json(connection, {
                            "type": "error",
                            "request_id": request_id,
                            "code": "INVALID_INPUT",
                        })
                        continue

                    send_json(connection, {
                        "type": "result",
                        "request_id": request_id,
                        "value_squared": value * value,
                    })
    finally:
        socket_path.unlink(missing_ok=True)


def request(socket_path: Path, values: list[int], timeout_s: float = 0.5) -> list[int]:
    results: list[int] = []
    with socket.socket(socket.AF_UNIX, socket.SOCK_SEQPACKET) as client:
        client.settimeout(timeout_s)
        client.connect(str(socket_path))
        ready = recv_json(client)
        if ready.get("type") != "ready" or ready.get("protocol") != 1:
            raise RuntimeError(f"unexpected readiness message: {ready}")

        for index, value in enumerate(values):
            request_id = f"demo-{index:04d}"
            send_json(client, {
                "type": "infer",
                "request_id": request_id,
                "deadline_ns": time.monotonic_ns() + int(timeout_s * 1e9),
                "value": value,
            })
            response = recv_json(client)
            if response.get("request_id") != request_id or response.get("type") != "result":
                raise RuntimeError(f"unexpected response: {response}")
            results.append(int(response["value_squared"]))

        send_json(client, {"type": "stop", "request_id": "stop-0001"})
        stopped = recv_json(client)
        if stopped.get("type") != "stopped":
            raise RuntimeError(f"unexpected stop response: {stopped}")
    return results


def wait_for_socket(socket_path: Path, process: mp.Process, timeout_s: float = 2.0) -> None:
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        if socket_path.exists():
            return
        if not process.is_alive():
            raise RuntimeError("worker exited before becoming ready")
        time.sleep(0.01)
    raise TimeoutError("worker did not create its socket")


def self_test() -> None:
    with tempfile.TemporaryDirectory(prefix="bounded-worker-") as directory:
        socket_path = Path(directory) / "worker.sock"
        process = mp.Process(target=serve, args=(socket_path,))
        process.start()
        wait_for_socket(socket_path, process)
        assert request(socket_path, [2, 3, 7]) == [4, 9, 49]
        process.join(timeout=2.0)
        if process.is_alive():
            process.terminate()
            process.join()
            raise TimeoutError("worker did not stop cleanly")
        if process.exitcode != 0:
            raise RuntimeError(f"worker exited with {process.exitcode}")
    print("self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["server", "client", "self-test"])
    parser.add_argument("--socket", type=Path, default=Path("/tmp/bounded-worker.sock"))
    parser.add_argument("values", nargs="*", type=int)
    args = parser.parse_args()

    if args.mode == "server":
        serve(args.socket)
    elif args.mode == "client":
        print(request(args.socket, args.values or [2, 3, 7]))
    else:
        self_test()


if __name__ == "__main__":
    main()
