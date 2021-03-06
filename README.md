# QuickBMS VSCode Extension
This is a Visual Studio Code extension that provides support for the [QuickBMS scripting language](https://aluigi.altervista.org/quickbms.htm).

* Syntax highlighting
* Hover documentation for commands (partial support)
* Go to definitions and references for functions
* Document symbols list

![Example screenshot of the QuickBMS language syntax highlighting](images/syntax_highlighting_example_01.png)

## Language server
This extension uses a language server to support several of its features. The language server that it uses can be found here:

https://github.com/ExcaliburZero/quickbms-lsp

## Language Documentation
Here are a few documentation links for QuickBMS and BMS (the language QuickBMS builds on).

* QuickBMS documentation txt file - https://aluigi.altervista.org/papers/quickbms.txt
* BMS/MexScript documentation wiki page - https://wiki.xentax.com/index.php/MexScript

## Development
This is currently a small hobby project, so any PRs for fixes and improvements are welcome.

## TODO
These are some potential features that could be implemented in the future:

* Make sure all syntax elements are properly highlighted (current implementation is partial)
* Auto-complete indented structures (for loops, function definitions, etc.)
* Provide code linting support (no existing linters as far as I am aware)