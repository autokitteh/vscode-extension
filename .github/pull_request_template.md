## Description

## Linear Ticket

## What type of PR is this? (check all applicable)

- [ ] 💡 (feat) - A New Feature (non-breaking change which adds functionality)
- [ ] 🔄 (refactor) - Code Refactoring - A code change that neither fixes a bug nor adds a feature
- [ ] 🐞 (fix) - Bug Fix (non-breaking change which fixes an issue)
- [ ] 🏎 (perf) - Optimization
- [ ] 📄 (docs) - Documentation - Documentation only changes
- [ ] 📄 (test) - Tests - Adding missing tests or correcting existing tests
- [ ] 🎨 (style) - Styles - Changes that do not affect the meaning of the code (white spaces, formatting, missing semi-colons, etc)
- [ ] ⚙️ (ci) - Continuous Integrations - Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
- [ ] ☑️ (chore) - Chores - Other changes that don't modify src or test files
- [ ] ↩️ (revert) - Reverts - Reverts a previous commit(s).

## Code Standards
- [ ] Notify only when user attention is needed, otherwise log to console.
- [ ] If you're not sure what is the proper behavior, consult with the product team.
- [ ] Reduce the use of `else` by employing early returns to make code more readable and less nested.
- [ ] MVC Separation: Ensure separation of concerns; views should only be manipulated by controllers (also the computing - sorting, fitlering, etc.), not by services, to maintain a clean MVC architecture.
- [ ] Before implementing custom logic, check if existing functions or utilities (like lodash) offer a simpler solution.
- [ ] Avoid using `!important` in CSS where possible.
- [ ] Use memoization for class calculations.
- [ ] Place constant strings in your code using I18n.


<!--
     For a timely review/response, please avoid force-pushing additional
     commits if your PR already received reviews or comments.

     Before submitting a Pull Request, please ensure you've done the following:
     - 👷‍♀️ Create small PRs. In most cases this will be possible.
     - ✅ Provide tests for your changes.
     - 📝 Use descriptive commit messages (as described below).
     - 📗 Update any related documentation and include any relevant screenshots.

     Commit Message Structure (all lower-case):
     <type>(optional ticket number): <description>
     [optional body]
-->
