* Check GitHub milestone for any open issues and PRs
* Update `README.md`
* Update default language server version in `package.json`
* Update the version number in `package.json`
* Update `CHANGELOG.md`
* Create a package file for the extension:

```bash
npm run compile && vsce package
```

* Close GitHub milestone
* Create a new release on GitHub
    * Set a tag name (ex. `0.0.1`)
    * Set the release title (ex. `0.0.1`)
    * Attach the generated package file
    * Click publish
* Upload the new package file to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage/publishers/excaliburzero)