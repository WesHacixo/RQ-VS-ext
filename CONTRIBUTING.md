# Contributing to VS Blue

Thank you for your interest in contributing to VS Blue! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm (v8 or later)
- VS Code (latest version)
- TypeScript (v5.0.0 or later)

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/vs-blue.git
   cd vs-blue
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build the extension:
   ```bash
   pnpm compile
   ```

5. Open the project in VS Code:
   ```bash
   code .
   ```

## Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feat/feature-name
   # or
   git checkout -b fix/bug-name
   ```

2. Make your changes following the project's coding standards

3. Run tests and ensure they pass:
   ```bash
   pnpm test
   ```

4. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add new feature"
   ```

5. Push your changes to your fork:
   ```bash
   git push origin feat/feature-name
   ```

6. Open a pull request against the `main` branch

## Code Style

- Follow the [TypeScript Coding Guidelines](https://google.github.io/styleguide/tsguide.html)
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Include appropriate test coverage for new features

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots or error messages if applicable
- Your environment (OS, VS Code version, etc.)

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, including new environment variables, exposed ports, useful file locations, and container parameters.
3. Increase the version numbers in any example files and the README.md to the new version that this Pull Request would represent.
4. The PR will be reviewed by the maintainers who may suggest changes.

## License

By contributing, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE).

4. Build the extension:

   ```bash
   npm run compile
   ```

5. Open the project in VS Code:

   ```bash
   code .
   ```

6. Press F5 to launch the Extension Development Host

## Development Guidelines

### Code Style

- Follow the TypeScript style guide.
- Use ESLint for code linting.
- Write meaningful commit messages.
- Add comments for complex logic.
- Keep functions small and focused.

### Testing

- Write unit tests for new features.
- Run tests before submitting PR:

  ```bash
  npm test
  ```

- Ensure all tests pass.
- Add tests for bug fixes.

### Performance

- Monitor memory usage.
- Optimize resource-intensive operations.
- Use appropriate data structures.
- Implement proper cleanup.
- Follow VS Code extension best practices.

### Documentation

- Update README.md for new features.
- Document configuration options.
- Add JSDoc comments.
- Update CHANGELOG.md.
- Include usage examples.

## Pull Request Process

1. Create a new branch for your feature/fix.
2. Make your changes.
3. Run tests and linting.
4. Update documentation.
5. Submit a pull request.
6. Wait for review and feedback.
7. Make requested changes.
8. Get approval and merge.

## Feature Requests

- Use GitHub Issues.
- Provide detailed description.
- Include use cases.
- Consider performance impact.
- Check existing issues first.

## Bug Reports

- Use GitHub Issues.
- Include steps to reproduce.
- Provide error messages.
- Add screenshots if relevant.
- Specify environment details.

## Release Process

1. Update version in package.json.
2. Update CHANGELOG.md.
3. Create release branch.
4. Run full test suite.
5. Build and package extension.
6. Create GitHub release.
7. Publish to VS Code Marketplace.

## Questions?

Feel free to open an issue for any questions or concerns.

Thank you for contributing to VS Blue!
