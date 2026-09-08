from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_local_web_dev_server_on_port_3100_can_call_the_api() -> None:
    """The documented alternate Next dev port must pass the browser preflight."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/v1/auth/device-login",
            headers={
                "Origin": "http://localhost:3100",
                "Access-Control-Request-Method": "POST",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3100"
