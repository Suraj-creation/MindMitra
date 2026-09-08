"""v1 API router — assembles all domain sub-routers."""

from __future__ import annotations

from fastapi import APIRouter

from .auth import router as auth_router
from .cognition import baseline_router
from .companion import router as companion_router
from .cognition import router as cognition_router
from .demo import router as demo_router
from .escalation import router as escalation_router
from .identity import router as identity_router
from .projection import router as projection_router
from .pwm import router as pwm_router
from .safety_demo import router as safety_router

v1_router = APIRouter(prefix="/v1")

v1_router.include_router(auth_router)
v1_router.include_router(cognition_router)
v1_router.include_router(companion_router)
v1_router.include_router(baseline_router)
v1_router.include_router(safety_router)
v1_router.include_router(identity_router)
v1_router.include_router(pwm_router)
v1_router.include_router(escalation_router)
v1_router.include_router(projection_router)
v1_router.include_router(demo_router)
