# Contributing to CmpStr

Thank you for your interest in contributing to **CmpStr**. Contributions of all kinds are welcome, whether they involve bug reports, documentation improvements, or code enhancements.

## Before You Contribute

CmpStr is designed to be **extensible at runtime**. Many use cases can be addressed by registering custom metrics, processors, or filters directly in your own project without modifying the library itself.

If you have ideas for features, algorithms, or improvements that could benefit a broader audience, please open a GitHub issue first to discuss the proposal.

## Reporting Issues

When reporting a bug or unexpected behavior, please include:

* A clear and concise description of the issue
* Steps to reproduce (ideally with a minimal example)
* Expected vs. actual behavior
* Version of CmpStr and runtime environment

Security-related issues should follow the instructions in [SECURITY.md](SECURITY.md) and must not be reported publicly.

## Contributing Code

To contribute code changes:

1. Fork the repository
2. Create a feature or fix branch from `master`
3. Apply your changes with clear, focused commits
4. Ensure existing tests pass and add tests where appropriate
5. Submit a pull request with a concise description of the changes

Please keep pull requests scoped and avoid unrelated refactoring.

## Development Guidelines

* Follow the existing project structure and coding style
* Maintain full TypeScript type safety
* Avoid introducing external runtime dependencies
* Ensure deterministic behavior and stable performance
* Public APIs should remain backward compatible within the same major version

## Documentation

Advanced extension patterns and runtime integration are documented in the GitHub Wiki. Visit **[Extending CmpStr](https://github.com/komed3/cmpstr/wiki/Extending-CmpStr)** for detailed information.

## License

By contributing to this repository, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for helping improve CmpStr.
