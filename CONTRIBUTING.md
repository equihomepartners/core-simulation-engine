# Contributing to Equihome Fund Simulation Engine

Thank you for considering contributing to the Equihome Fund Simulation Engine! This document outlines the process for contributing to the project.

## Development Process

1. **Fork the repository** and create your branch from `main`.
2. **Make your changes** and ensure they follow the project's coding standards.
3. **Write tests** for your changes to maintain code quality.
4. **Update documentation** to reflect any changes in functionality.
5. **Submit a pull request** with a clear description of your changes.

## Coding Standards

### Python

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use type hints for function parameters and return values
- Write docstrings for all functions, classes, and modules
- Use the `Decimal` type for financial calculations to avoid floating-point errors

### JavaScript

- Follow the project's ESLint configuration
- Use ES6+ features where appropriate
- Write JSDoc comments for functions and classes
- Prefer functional programming patterns for data transformations

## Testing

- Write unit tests for all new functionality
- Ensure all tests pass before submitting a pull request
- Include integration tests for API endpoints and UI components
- Test edge cases and error conditions

## Documentation

- Update the relevant documentation files when making changes
- Document all configuration options and their default values
- Provide examples for complex functionality
- Keep the API documentation up to date

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

## Pull Request Process

1. Update the README.md or documentation with details of changes if appropriate
2. Update the CHANGELOG.md with details of changes
3. The PR will be merged once it has been reviewed and approved by a maintainer

## Reporting Bugs

When reporting bugs, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

## Feature Requests

Feature requests are welcome. Please provide:

- A clear and descriptive title
- A detailed description of the proposed feature
- Any relevant examples or mockups
- Explanation of why this feature would be useful to most users

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We strive to maintain a welcoming and inclusive environment for all contributors.

## Questions?

If you have any questions about contributing, please reach out to the project maintainers.
