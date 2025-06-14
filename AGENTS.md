# Agent Collaboration and PR Guidelines

## Branching Strategy

We follow a trunk-based development workflow with feature branches:

- `main` - Production-ready code. Always stable and deployable.
- `feature/*` - Feature branches for new functionality
- `fix/*` - Bug fixes for the next release
- `docs/*` - Documentation updates
- `chore/*` - Maintenance tasks and dependency updates

## Pull Request Process

### Creating a PR
1. Create a new branch from `main` following the naming convention: `type/descriptive-name`
   ```bash
   git checkout -b feature/awesome-feature
   ```

2. Make your changes with clear, atomic commits
   - Use the conventional commit format:
     ```
     type(scope): concise description

     [optional body with details]

     [optional footer with issue references]
     ```
   - Types: feat, fix, docs, style, refactor, perf, test, chore

3. Push your branch and create a PR
   ```bash
   git push -u origin feature/awesome-feature
   ```

### PR Requirements
- Link related issues using GitHub's keywords (fixes #123, closes #456)
- Ensure all CI checks pass
- Update documentation if needed
- Include tests for new functionality
- Keep PRs focused and reasonably sized

### Review Process
1. Request reviews from relevant team members
2. Address all review comments
3. Update the PR with any requested changes
4. Ensure all discussions are resolved before merging

## Code Review Guidelines

### As an Author
- Be open to feedback and suggestions
- Explain your reasoning when you disagree
- Keep PRs small and focused
- Include context in PR description

### As a Reviewer
- Be constructive and kind
- Focus on code, not the person
- Suggest alternatives when possible
- Check for:
  - Code quality and consistency
  - Performance implications
  - Security considerations
  - Test coverage

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

[body]

[footer]
```

Example:
```
feat(monitor): add memory usage tracking

- Add memory usage collection to performance monitor
- Update dashboard to display memory metrics

Fixes #123
```

## Agent-Specific Guidelines

### Code Style
- Follow the project's ESLint and Prettier configurations
- Use TypeScript for type safety
- Document complex logic with JSDoc

### Testing
- Write unit tests for new features
- Update tests when fixing bugs
- Ensure tests pass before creating a PR

### Documentation
- Update relevant documentation when making changes
- Add comments for complex logic
- Keep JSDoc up to date

### Performance
- Be mindful of memory usage
- Optimize hot code paths
- Use appropriate data structures

## Workflow Automation

### Branch Protection
- `main` branch is protected
- Require pull request reviews before merging
- Require status checks to pass
- Require linear history
- Require conversation resolution before merging

### CI/CD Pipeline
- Linting and type checking on every push
- Unit tests on every push
- Build verification on PRs
- Automated releases on version tags

## Troubleshooting

### Common Issues
- **Build failures**: Run `pnpm install && pnpm build` locally
- **Test failures**: Run `pnpm test` to identify issues
- **Type errors**: Check TypeScript compiler output

### Getting Help
1. Check the project documentation
2. Search existing issues
3. Ask in the team chat
4. Create an issue if needed

## 🛠️ RedQueen MCP CLI Usage

All commands are run from the `projects/cloudflare/mcp-server/` directory.

### Prerequisites
- `.env` file with your API key:
  ```
  REDQUEEN_API_KEY=your-very-secret-key-here
  ```
- Install dependencies:
  ```
  pnpm install
  ```

### Commands & Aliases

| Command         | Alias | Args                                      | Description                       |
|----------------|-------|-------------------------------------------|-----------------------------------|
| getContract    | getc  | <contractId>                              | Fetch a contract by ID            |
| claim          | clam  | <contractId> <agentId> <srDelta>          | Submit a claim                    |
| reportDrift    | drft  | <contractId> <agentId> <drift>            | Report drift                      |
| getTrustScore  | trst  | <agentId>                                 | Get agent trust score             |
| --help, -h     | help  |                                           | Show help screen                  |

### Usage Examples

```sh
pnpm tsx scripts/mcp-client.ts getc MemoryTrace::Indexer
pnpm tsx scripts/mcp-client.ts clam MemoryTrace::Indexer RedQueen::Windsurf 0.81
pnpm tsx scripts/mcp-client.ts drft MemoryTrace::Indexer RedQueen::Windsurf 0.12
pnpm tsx scripts/mcp-client.ts trst RedQueen::Windsurf
pnpm tsx scripts/mcp-client.ts --help
```
