/**
 * Typed Action Execution & Governance Engine (Phase 3)
 * Enforces argument validation, authorization, consent checks, audit logging,
 * and produces immutable interaction events for every action.
 */

import { substrateRepo } from "@/substrate/repository";
import { personalIntelligenceService } from "@/substrate/service";
import type {
  ActionType,
  CallPersonParams,
  CreateReminderParams,
  NavigateToParams,
  PlayMusicParams,
  ShowMemoryParams,
  ShowPersonParams,
  ShowPhotoParams,
  ShowRoutineParams,
  ShowTimelineParams,
  StartActivityParams,
  TypedAction,
} from "./types";

export interface ActionExecutionResult {
  success: boolean;
  action: TypedAction;
  audit_id: string;
  error?: string;
  event_id?: string;
}

export class ActionExecutor {
  /**
   * Validates parameters, checks authorization & consent, logs audit record,
   * executes the bounded action, and produces an interaction event.
   */
  public async executeAction(
    personId: string,
    actionType: ActionType,
    params: any,
    actorId = "actor:purnima",
    actorRole = "person",
    purpose = "personalisation"
  ): Promise<ActionExecutionResult> {
    const actionId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const eventId = `evt_action_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // ── 1. SCHEMA & ARGUMENT VALIDATION ─────────────────────────────────────
    const validationError = this.validateParameters(actionType, params);
    if (validationError) {
      await substrateRepo.logAuditEvent({
        audit_id: auditId,
        actor_id: actorId,
        person_id: personId,
        action: "READ",
        target_table: "action_dispatch",
        target_id: actionId,
        purpose: "personalisation",
        result: "GUARD_BLOCKED",
        reason: `Invalid action arguments for ${actionType}: ${validationError}`,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        audit_id: auditId,
        error: validationError,
        action: {
          action_id: actionId,
          type: actionType,
          label: this.getActionLabel(actionType, params),
          parameters: params,
          authorized: true,
          consent_verified: false,
          audit_id: auditId,
          status: "failed",
          error: validationError,
        },
      };
    }

    // ── 2. AUTHORIZATION & CONSENT ENFORCEMENT ──────────────────────────────
    // Map action type to required consent category
    const requiredCategory = this.getRequiredConsentCategory(actionType);
    let consentOk = true;

    if (actorRole !== "person") {
      const consentResult = await personalIntelligenceService.evaluateConsentFirewall(
        actorId,
        personId,
        requiredCategory as any,
        purpose as any
      );
      consentOk = consentResult.decision === "PERMIT";
      if (!consentOk) {
        await substrateRepo.logAuditEvent({
          audit_id: auditId,
          actor_id: actorId,
          person_id: personId,
          action: "FIREWALL_DENY",
          target_table: "action_dispatch",
          target_id: actionId,
          purpose: purpose as any,
          result: "DENIED",
          reason: `Consent withheld for ${actionType} under ${requiredCategory}`,
          timestamp: new Date().toISOString(),
        });

        return {
          success: false,
          audit_id: auditId,
          error: `Consent withheld for category ${requiredCategory}`,
          action: {
            action_id: actionId,
            type: actionType,
            label: this.getActionLabel(actionType, params),
            parameters: params,
            authorized: false,
            consent_verified: false,
            audit_id: auditId,
            status: "denied",
            error: "Consent not granted for target category.",
          },
        };
      }
    }

    // ── 3. AUDITABLE EXECUTION LOGGING ──────────────────────────────────────
    await substrateRepo.logAuditEvent({
      audit_id: auditId,
      actor_id: actorId,
      person_id: personId,
      action: "READ",
      target_table: "action_dispatch",
      target_id: actionId,
      purpose: purpose as any,
      result: "SUCCESS",
      reason: `Authorized execution of typed action ${actionType}`,
      timestamp: new Date().toISOString(),
    });

    // ── 4. APPEND-ONLY INTERACTION / ACTION EVENT ───────────────────────────
    await substrateRepo.appendInteractionEvent({
      event_id: eventId,
      person_id: personId,
      session_id: `ses_${Date.now()}`,
      timestamp: new Date().toISOString(),
      surface: "assistant",
      route: "/assistant",
      component: "action-executor",
      event_type: "ASSISTANT_TYPED_ACTION",
      input_modality: "system",
      language: "en",
      result: "success",
      assistance_level: "none",
      provenance_id: `prov_${Date.now()}`,
      metadata: {
        action_id: actionId,
        action_type: actionType,
        parameters: params,
        audit_id: auditId,
        actor_role: actorRole,
      },
    });

    const actionObj: TypedAction = {
      action_id: actionId,
      type: actionType,
      label: this.getActionLabel(actionType, params),
      target: params.target || params.section || params.person_id,
      parameters: params,
      authorized: true,
      consent_verified: true,
      audit_id: auditId,
      status: "executed",
    };

    return {
      success: true,
      action: actionObj,
      audit_id: auditId,
      event_id: eventId,
    };
  }

  private validateParameters(type: ActionType, p: any): string | null {
    if (!p || typeof p !== "object") return "Action parameters must be an object.";

    switch (type) {
      case "show_person":
        if (!p.person_id && !p.display_name) return "show_person requires person_id or display_name.";
        break;
      case "show_photo":
        if (!p.asset_id && !p.url && !p.caption) return "show_photo requires asset_id, url, or caption.";
        break;
      case "show_memory":
        if (!p.memory_id && !p.headline) return "show_memory requires memory_id or headline.";
        break;
      case "navigate_to":
        if (!p.section || !["day", "life", "activity", "people", "help"].includes(p.section)) {
          return "navigate_to requires a valid section (day, life, activity, people, help).";
        }
        break;
      case "start_activity":
      case "resume_activity":
        if (!p.activity_id && !p.title) return "activity action requires activity_id or title.";
        break;
      case "play_music":
        if (!p.track_id && !p.title && !p.genre) return "play_music requires track_id, title, or genre.";
        break;
      case "call_person":
        if (!p.name && !p.phone) return "call_person requires name or phone.";
        break;
      case "create_reminder":
        if (!p.title) return "create_reminder requires a title.";
        break;
      case "show_routine":
      case "show_timeline":
      case "request_human_help":
        break;
      default:
        return `Unknown action type: ${type}`;
    }
    return null;
  }

  private getRequiredConsentCategory(type: ActionType): string {
    switch (type) {
      case "show_person":
      case "call_person":
        return "personal_identity";
      case "show_photo":
        return "media_assets";
      case "show_memory":
        return "life_story_memory";
      case "navigate_to":
      case "start_activity":
      case "resume_activity":
      case "show_routine":
      case "show_timeline":
        return "assistance_policies";
      case "play_music":
        return "personal_identity";
      case "create_reminder":
      case "request_human_help":
        return "assistance_policies";
      default:
        return "personal_identity";
    }
  }

  private getActionLabel(type: ActionType, p: any): string {
    switch (type) {
      case "show_person":
        return `View ${p.display_name || "Loved Person"}`;
      case "call_person":
        return `Call ${p.name || p.display_name || "Contact"} (${p.phone || ""})`;
      case "show_photo":
        return `Open Photograph: ${p.caption || p.title || "Family Memory"}`;
      case "show_memory":
        return `Read Memory: ${p.headline || "Cherished Reminiscence"}`;
      case "navigate_to":
        return `Go to ${p.section?.toUpperCase()} View`;
      case "start_activity":
        return `Start Activity: ${p.title || "Gentle Activity"}`;
      case "resume_activity":
        return `Continue: ${p.title || "Gentle Activity"}`;
      case "play_music":
        return `Play Music: ${p.title || "Bamboo Flute"}`;
      case "create_reminder":
        return `Reminder: ${p.title}`;
      case "show_routine":
        return "See Today's Daily Schedule";
      case "show_timeline":
        return "View Yesterday's Timeline";
      case "request_human_help":
        return "Connect with Daughter Anu / Help";
      default:
        return "Perform Action";
    }
  }
}

export const actionExecutor = new ActionExecutor();
