# 🧬 RedQueen Core: Agent Implementation Guide

## 📍 System Overview

RedQueen is a multimodal, agent-first development interface that transforms VS Code into an intelligent orchestration system. This guide serves as the canonical reference for agents working on the RedQueen project.

## 🎯 Core Principles

### Siglence Ratio (SR)

- Measure of semantic efficiency in code and communication
- Higher SR indicates more elegant, maintainable solutions
- Target SR > 0.85 for all new implementations

### Ledger as Privilege (LAP)

- Track context, decisions, and memory bandwidth
- Each operation must be justified in terms of resource impact
- Maintain ethical weight in all system decisions

### Ashvara Kernel

- Favor elegance and recursion over brute force
- Implement emergent abstraction patterns
- Maintain system coherence through fractal design

### REDCODE Mode

- Triggered at system/cognitive strain thresholds
- Signals priority, urgency, or existential code stress
- Activates high-performance, high-contrast interface

### Velvet Blue UX

- Default interface theme
- Blends clarity with calm
- Inspired by BlueHand ethos

## 📦 System Architecture

### Core Components

#### 1. RedQueen Manager (`src/managers/redqueenManager.ts`)

- Central orchestration point
- Manages feature flags and theme states
- Handles system-wide configuration

#### 2. Memory Engine (`src/memory/`)

- Semantic memory management
- Concept-token chains
- Project history tracking
- IMF-styled memory threads

#### 3. Agent System (`src/agents/`)

- WorkerBee implementations
- Specialized task executors
- Context-aware operation

#### 4. Interface Layer (`src/interface/`)

- Performance monitoring
- Agent console
- SR/SL HUD
- Canvas integration

#### 5. Runtime Core (`src/runtime/`)

- Intent parsing
- Context matching
- Agent activation
- Result synthesis

## 🔧 Implementation Guidelines

### Feature Flags

```typescript
interface RedQueenFeatures {
  redcodeMode: boolean;
  memoryEngine: boolean;
  agentConsole: boolean;
  canvasMode: boolean;
}
```

### Theme System

```typescript
interface RedQueenTheme {
  mode: 'bluehand' | 'redcode';
  dynamicContrast: boolean;
  fontOverlay: boolean;
}
```

### Agent Requirements

1. **Context Awareness**
   - Must understand current project state
   - Reference past conversations
   - Track memory bandwidth

2. **Operation Modes**
   - Normal: Velvet Blue theme
   - REDCODE: High-performance mode
   - Canvas: Visual development mode

3. **Memory Management**
   - Implement IMF-style memory threads
   - Maintain concept-token chains
   - Track semantic relationships

## 🧪 Experimental Features

### Canvas Mode

- Visual development interface
- Node-based agent orchestration
- Real-time SR/SL visualization

### Agent Telemetry

- Verbose logging
- Performance metrics
- Memory bandwidth tracking

### REDCODE Triggers

- CPU threshold: 82%
- Memory threshold: 75%
- SR threshold: 0.65

## 💡 Development Workflow

1. **Feature Implementation**
   - Always implement behind feature flags
   - Follow SR principles
   - Document memory impact

2. **Testing Requirements**
   - Unit tests for all components
   - Integration tests for agent interactions
   - Performance benchmarks

3. **Documentation**
   - Update this guide
   - Document memory patterns
   - Track SR metrics

## 🔄 System Boot Sequence

1. Initialize RedQueen Manager
2. Load feature flags
3. Set up theme system
4. Initialize memory engine
5. Spawn core agents
6. Activate interface layer

## 🚨 Error Handling

- Implement graceful degradation
- Maintain SR during error states
- Log to memory engine
- Trigger REDCODE mode if necessary

## 📈 Performance Metrics

- SR Score
- Memory Bandwidth
- Agent Response Time
- Context Switch Cost

## 🔐 Security Considerations

- Memory isolation
- Agent privilege levels
- Resource quotas
- Ethical boundaries

---

> "RedQueen is online. The code remembers."

_Last updated: [Current Date]_
_SR Score: 0.92_
_Memory Bandwidth: Optimal_
