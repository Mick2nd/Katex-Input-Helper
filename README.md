# Katex Input Helper Joplin Plugin

This plugin can be used to support the input of Mathematical formulae. It does this by opening an input dialog by command, then generating the formula and finally returning the edited formula back to the original note.

## Basic Instructions

1. Open a note with a formula area, select a piece of the formula to be processed.
2. Invoke the Katex Input Helper dialog with a keyboard shortcut.
3. Process the formula in the upper part of the dialog in Katex format.
4. Get feedback in the lower part of the dialog where the generated formula is displayed.
5. Finally leave the dialog either by pressing the **Okay** or the **Cancel** button.
6. By pressing Okay the changed content is returned to the note and replaces the original selection.
7. By pressing Cancel nothing is changed.

## Origin of the Software

The plugin is based on the *Visual Math Editor* by David Grima, a freeware which can be changed and distributed freely. I made the following changes to this software:

1. Reverse engineering
2. Updated the included software libraries to current ones.
3. Replaced the MathJax package by a Katex package.
4. Removed some components of the software not needed for this purpose, like:
   1. AsciiMath support
   2. Translation of the Katex expression into MathML
   3. A HTML mode to support html input
   4. Some dialogs and menu items
   5. Some MathJax expressions are not supported in Katex and removed for this reason
5. But most components are left as is and the external appearance is preserved

As You can see, this software is feature rich and alleviates the creation of formluae. My hope is one will get further support by the integration into *Joplin* as a plugin.

This software is available on the net [here](https://visualmatheditor.equatheque.net/VisualMathEditor.html?runLocal&codeType=Latex&encloseAllFormula=false&style=aguas&localType=en_US) and You can view at it to get an impression.

## Features

1. Editing in a text editor like the one in Joplin
2. Feedback in the formula output area
3. 16 palettes with formula templates like Sum and Product, Integral and much more
4. Formula dialogs with samples with can be incorporated easily or studied for learning the Katex language
5. A **custom equations** dialog which can be used to maintain one's own formula library and with the possibility to Add, Remove, Load, Save the formula set. This set is persisted through invocations of Joplin as hidden setting.
6. Window positions and sizes are persisted

## Some Screenshots

The main dialog window

![Main Dialog Window](./img/Katex-Input-Helper.png)

The custom equations dialog

<img src="img/Custom-Equations.png" width="500" />

## Known Problems

- Sometimes a start of the dialog crashes. Mainly I could observe this for first time starts of the
  production version. Perhaps this has to do with caching of the plugin. Restart helps.
- A minor problem is a missing update of the language of the data grid paging bar in the *Custom 
  Equations* dialog. This only appears during language change during an actual activation of the
  dialog.

## Release Notes

### 1.0.2

In the last release a few bugs have sneaked in. Those have been fixed now:

- Info dialog did not show the content of 3 tabs
- The resources dialog did not show completely
- The Title field in the *Custom Equations* dialog was no longer editable

### 1.0.1

Bug fixes and improvements

- Some localizations in Custom Equations dialog have been improved
- Persistence concept was improved
- Added filtering to the Custom Equations dialog
- Architectural changes

### 1.0.0

Initial release
