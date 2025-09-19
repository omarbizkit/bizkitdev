# Phase 1 Design: Troubleshooting Data Model

**Date**: 2025-09-13
**Extracted From**: Feature specification `/specs/054-troubleshoot-e2e-workflow-failure/spec.md`

## Entity Overview

The troubleshooting feature requires tracking workflow failures, test execution details, log analysis, and configuration differences between environments. The primary entities represent the workflow from failure detection through resolution.

## Core Entities

### Entity 1: WorkflowRun
**Purpose**: Represents individual GitHub Actions workflow executions

**Fields**:
- `id` (string): Workflow run identifier (e.g., "feat: implement WCAG AAA light theme compliance and organize design r… #53")
- `status` (enum): Execution status - "success", "failure", "cancelled", "in_progress"
- `created_at` (DateTime): When workflow was triggered
- `updated_at` (DateTime): When workflow completed or last updated
- `commit_sha` (string): Git commit hash that triggered the workflow
- `branch` (string): Branch name (e.g., "main", "054-troubleshoot-e2e-workflow-failure")
- `logs` (LogEntry[]): Array of parsed log entries from workflow execution
- `total_jobs` (number): Total number of jobs in workflow
- `failed_jobs` (number): Number of jobs that failed

**Validation Rules**:
- `id` must be unique and non-empty
- `status` must be one of enumerated values
- `created_at` must be before or equal to `updated_at`
- `total_jobs` must be >= 0
- `failed_jobs` must be <= `total_jobs`

### Entity 2: TestScenario
**Purpose**: Individual test cases within E2E test suite

**Fields**:
- `id` (string): Test identifier (e.g., "test_login_flow", "test_navigation_menu")
- `name` (string): Human-readable test name
- `file_path` (string): Relative path to test file (e.g., "tests/e2e/subscription-flow.spec.ts")
- `status` (enum): Test execution result - "passed", "failed", "skipped", "timed_out"
- `duration_ms` (number): Execution time in milliseconds
- `error_message` (string): Error details if test failed
- `browser` (string): Browser type used (e.g., "chromium", "firefox")
- `viewport` (Dimensions): Viewport size { width: number, height: number }
- `page_url` (string): URL being tested during failure
- `screenshot_path` (string): Path to captured screenshot (optional)

**Validation Rules**:
- `id` and `name` must be non-empty
- `duration_ms` must be >= 0
- `browser` must be one of supported browser types
- For failed tests, `error_message` must be provided

### Entity 3: FailurePattern
**Purpose**: Categorized failure patterns with diagnostic information

**Fields**:
- `pattern_id` (string): Unique identifier (e.g., "PORT_BIND_ERROR", "ELEMENT_TIMEOUT", "ENVIRONMENT_MISCONFIG")
- `category` (enum): Pattern category - "configuration", "timeout", "environment", "dependency", "browser", "network"
- `severity` (enum): Impact level - "critical", "high", "medium", "low"
- `description` (string): Human-readable failure description
- `indicators` (string[]): Array of log patterns that indicate this failure
- `root_cause` (string): Technical explanation of underlying issue
- `resolution_steps` (ResolutionStep[]): Ordered array of resolution approaches
- `prevention_measures` (string[]): Preventive measures to avoid this failure

**Validation Rules**:
- `pattern_id` must be unique and Upper Snake Case
- `category` and `severity` must be valid enumerated values
- At least one `indicators` pattern must be provided
- `resolution_steps` must contain at least one step for critical/high severity patterns

### Entity 4: EnvironmentConfig
**Purpose**: Configuration differences between local development and CI environments

**Fields**:
- `environment_type` (enum): Type of environment - "local_development", "github_actions_ci", "production"
- `node_version` (string): Node.js version (e.g., "18.19.0")
- `playwright_version` (string): Playwright version
- `port` (number): Server port (fixed at 4321)
- `base_url` (string): Base URL for tests (e.g., "http://localhost:4321", "http://127.0.0.1:4321")
- `environment_variables` (key-value map): Critical environment variables
- `working_directory` (string): Working directory path
- `available_memory_mb` (number): Approximate memory available

**Validation Rules**:
- `environment_type` must be one of enumerated values
- `port` must be 4321 (fixed value per project context)
- `base_url` must include the correct port
- Environment variables must include required CI/CD variables

### Entity 5: LogEntry
**Purpose**: Parsed workflow execution log entries

**Fields**:
- `timestamp` (DateTime): When log entry was recorded
- `level` (enum): Log level - "debug", "info", "warn", "error", "fatal"
- `source` (string): Component/source generating the log (e.g., "playwright:test", "server:startup", "workflow:job")
- `message` (string): Original log message
- `parsed_data` (key-value map): Structured data extracted from log
- `error_code` (string): Error code if applicable
- `stack_trace` (string[]): Stack trace lines if error occurred

## Entity Relationships

```
WorkflowRun
├── TestScenario[] (1:N) - workflow contains multiple test scenarios
├── LogEntry[] (1:N) - workflow generates multiple log entries
└── EnvironmentConfig (1:1) - workflow runs in specific environment

TestScenario
├── FailurePattern (N:1) - test failure matches failure pattern
└── LogEntry[] (N:M) - test generates specific log entries

LogEntry
└── FailurePattern (N:1) - log entry matches failure pattern indicators
```

## Data Model Validation Rules

### Cross-Entity Validation

1. **Workflow-Test Consistency**:
   - If workflow fails, at least one TestScenario must have status "failed"
   - If workflow succeeds, no TestScenario should have status "failed"
   - Test scenario timestamps must be within workflow execution window

2. **Failure Pattern Assignment**:
   - Each TestScenario with status "failed" must be linked to at least one FailurePattern
   - FailurePattern indicators must match at least one LogEntry message from related tests

3. **Environment Validation**:
   - All workflow runs on same branch must use same EnvironmentConfig
   - CI workflows must have complete EnvironmentConfig (no undefined values)

4. **Log Entry Integrity**:
   - All LogEntry timestamps must be chronologically ordered within workflow
   - LogEntry levels should escalate appropriately (warning -> error -> fatal)

## State Transitions

### WorkflowRun State Machine
- `pending` → `in_progress`: When workflow starts
- `in_progress` → `success`: When all tests pass
- `in_progress` → `failure`: When any test fails
- `in_progress` → `cancelled`: When workflow is manually stopped

### TestScenario State Machine
- `queued` → `running`: When test begins execution
- `running` → `passed`: When test completes successfully
- `running` → `failed`: When test encounters error
- `running` → `timed_out`: When test exceeds timeout period
- `running` → `skipped`: When test is programmatically skipped

## Implementation Notes

**Entity Storage**: Temporary analysis structures - no persistent storage required
**Data Sources**: GitHub CLI for logs, environment inspection for configuration
**Validation Strategy**: Real-time validation during data ingestion and analysis
**Memory Management**: Clean up entities after workflow analysis to prevent memory leaks