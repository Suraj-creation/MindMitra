import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ambientAudio } from "../src/lib/ambient-audio.js";
import { speakWarmly, cancelEmpathicSpeech, isSpeechSynthesisActive } from "../src/lib/empathic-speech.js";
import { getStoredOnboardingProfile, DEFAULT_ONBOARDING_PROFILE } from "../src/lib/onboarding-state.js";

test("Design System: DESIGN.md exists and contains Brahmaputra Mist tokens", () => {
  const designMdPath = path.resolve(process.cwd(), "DESIGN.md");
  assert.ok(fs.existsSync(designMdPath), "DESIGN.md must exist at root");

  const content = fs.readFileSync(designMdPath, "utf-8");
  assert.match(content, /Brahmaputra Mist/i, "Must specify Brahmaputra Mist design theme");
  assert.match(content, /#032212/i, "Must define Deep Tea Forest (#032212)");
  assert.match(content, /#1a3826/i, "Must define Primary Deep Moss / Tea (#1a3826)");
  assert.match(content, /#fe932c/i, "Must define Amber Marigold (#fe932c)");
  assert.match(content, /#fef9f0/i, "Must define Frosted Silk Surface (#fef9f0)");
  assert.match(content, /touch-target-min/i, "Must define 56px touch target minimum");
});

test("CSS Tokens: src/index.css implements ratified design system", () => {
  const cssPath = path.resolve(process.cwd(), "src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css must exist");

  const cssContent = fs.readFileSync(cssPath, "utf-8");
  assert.match(cssContent, /--color-surface:\s*#fef9f0/i, "Surface token must match #fef9f0");
  assert.match(cssContent, /--color-primary:\s*#1a3826/i, "Primary token must match #1a3826");
  assert.match(cssContent, /--color-secondary:\s*#904d00/i, "Secondary token must match #904d00");
  assert.match(cssContent, /--touch-target-min:\s*56px/i, "Touch target min must be 56px");
  assert.match(cssContent, /Merriweather/i, "Must specify Merriweather display font");
  assert.match(cssContent, /gentleAura/i, "Must define gentleAura animation keyframe");
});

test("Audio Engine: ambientAudio methods exist and operate safely", () => {
  assert.equal(typeof ambientAudio.playCourtyardSounds, "function", "playCourtyardSounds must be a function");
  assert.equal(typeof ambientAudio.playFolkFlute, "function", "playFolkFlute must be a function");
  assert.equal(typeof ambientAudio.playTanpuraDrone, "function", "playTanpuraDrone must be a function");
  assert.equal(typeof ambientAudio.stop, "function", "stop must be a function");
  assert.equal(typeof ambientAudio.active, "function", "active must be a function");

  // In Node environment without window.AudioContext, it should safely return false without throwing
  const fluteRes = ambientAudio.playFolkFlute();
  assert.equal(typeof fluteRes, "boolean");

  const courtyardRes = ambientAudio.playCourtyardSounds();
  assert.equal(typeof courtyardRes, "boolean");

  ambientAudio.stop();
  assert.equal(ambientAudio.active(), false);
});

test("Empathic Speech: synthesis helpers exist and handle non-browser runtimes gracefully", () => {
  assert.equal(typeof speakWarmly, "function");
  assert.equal(typeof cancelEmpathicSpeech, "function");
  assert.equal(typeof isSpeechSynthesisActive, "function");

  // In Node, calling speakWarmly should not crash
  assert.doesNotThrow(() => {
    speakWarmly("নমস্কাৰ পূৰ্ণিমা বাইদেউ");
    cancelEmpathicSpeech();
  });
  assert.equal(isSpeechSynthesisActive(), false);
});

test("Onboarding State: profile defaults adhere to Tezpur cultural baseline", () => {
  assert.equal(DEFAULT_ONBOARDING_PROFILE.name, "Purnima Devi");
  assert.equal(DEFAULT_ONBOARDING_PROFILE.honorificAssamese, "আইতা");
  assert.equal(DEFAULT_ONBOARDING_PROFILE.preferredLanguage, "as");

  // In headless test without localStorage, fallback profile is returned
  const profile = getStoredOnboardingProfile();
  assert.ok(profile.name, "Profile must have a valid name");
  assert.equal(profile.preferredLanguage, "as", "Default language is Assamese");
});

test("Landing Page Components: verify file exports and structure", () => {
  const dayViewPath = path.resolve(process.cwd(), "src/components/person-day-view.tsx");
  assert.ok(fs.existsSync(dayViewPath), "person-day-view.tsx must exist");
  const dayViewContent = fs.readFileSync(dayViewPath, "utf-8");

  // Cultural context verification
  assert.match(dayViewContent, /তেজপুৰ, অসম/i, "Must reference Tezpur, Assam");
  assert.match(dayViewContent, /প্ৰভাতৰ শুভেচ্ছা/i, "Must have Assamese morning greeting");
  assert.match(dayViewContent, /Listen to courtyard sounds/i, "Must have courtyard sounds interaction");
  assert.match(dayViewContent, /Cardamom Tea with Anu/i, "Must include 4:00 PM tea milestone");
  assert.match(dayViewContent, /Rina calls from Guwahati/i, "Must include 5:00 PM family call milestone");
  assert.match(dayViewContent, /Evening Prayer & Light Meal/i, "Must include 7:30 PM prayer milestone");
  assert.match(dayViewContent, /Talk with MindMitra Companion/i, "Must have ambient companion section");
  assert.match(dayViewContent, /Tele-MANAS 14416/i, "Must have emergency healthcare connection");

  // Header and App shell verification
  const appPath = path.resolve(process.cwd(), "src/components/person-app.tsx");
  assert.ok(fs.existsSync(appPath), "person-app.tsx must exist");
  const appContent = fs.readFileSync(appPath, "utf-8");
  assert.match(appContent, /MindMitra/i);
  assert.match(appContent, /PersonNavigation/i);
  assert.match(appContent, /Northeast Journey/i);
  assert.match(appContent, /PhoneOff/i);
});
