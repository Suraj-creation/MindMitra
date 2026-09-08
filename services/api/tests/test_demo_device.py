from __future__ import annotations

import pytest

from app.api.v1.demo import DEMO_DEVICE_SECRET, PERSON_ID


@pytest.mark.asyncio
async def test_dev_seed_includes_a_demo_person_tablet(client) -> None:
    seed = await client.post("/v1/demo/seed")
    assert seed.status_code == 200, seed.text

    login = await client.post(
        "/v1/auth/device-login",
        json={"person_id": PERSON_ID, "device_secret": DEMO_DEVICE_SECRET},
    )

    assert login.status_code == 200, login.text
