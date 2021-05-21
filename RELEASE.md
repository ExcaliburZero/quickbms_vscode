* Update `README.md`
* Update the version number in `package.json`
* Update `CHANGELOG.md`
* Create a package file for the extension:

```bash
vsce package
```

* Create a new release on GitHub
    * Set a tag name (ex. `0.0.1`)
    * Set the release title (ex. `0.0.1`)
    * Attach the generated package file
    * Click publish
* Upload the new package file to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage/publishers/excaliburzero)