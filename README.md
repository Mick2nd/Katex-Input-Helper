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

## Step - by - Step Instructions

1. Enter the *Katex Input Helper* with a certain selection of a formula. With no selection in the current note the editor will be opened empty.
1. Insertion of formulae from the palette window(s)
   1. Open the palette with the desired template, f.i. an integral
   2. Click the template to insert it into the editor window
   3. Fill in the missing pieces of the formula
   4. This filling can be recursive, e.g. require another click on a different template
   5. The same can be done with the usage of other auxiliary windows, f.i. horizontal or vertical spacing, matrices or sample equations
   6. Many of them don't use placeholders as the "templates" often do
5. Returning a processed formula
   1. Simply leave the dialog with *Okay* and the content of the editor area will be returned back to the Joplin note and replaces the original selection.
   2. Pressing *Cancel* leaves the original note as it was before invocation of the dialog
3. Loading and saving the editor area
   This can be done by invoking the menu commands *File - Open* or *File - Save* respectively
4. Working with the *Custom Equations* dialog.
   One can invoke this dialog by clicking *Insert - Custom Equations*.
   It is possible to perform the following tasks:
   1. Save the set of formulae into a json file
   2. Load a set of formulae from a json file
   3. Add a formula from the editor area
   4. Remove a formula from the datagrid
   5. Click a formula to insert it into the editor area
   6. Edit the *Title* field of a formula by double - clicking it
   7. Filter the set of formulae by a filter expression. Actually this checks if the filter expression is contained in the title field
   8. Sort the formulae after the title field
   9. Select pages of a huge formula set

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

As You can see, this software is feature rich and alleviates the creation of formulae. My hope is one will get further support by the integration into *Joplin* as a plugin.

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

- Sometimes a start of the dialog crashes. Mainly I could observe this for first time starts of the production version. Perhaps this has to do with caching of the plugin. Restart helps.
- A minor problem is a missing update of the language of the data grid paging bar in the *Custom Equations* dialog. This only appears during language change during an actual activation of the dialog.
- Only 2 languages are fully localized: English and German. In the original software 7 languages are supported: French, Spanish, Russian, Vietnamese and Arabian in addition to the 2 above. The missing phrases fall back to the English version.

## Release Notes

### 1.0.3

Fixed the following problems:

- *Custom Equations* dialog inserted formula twice on click.
- Certain insertions did select the insertion afterwards. This is fixed now and enables easy successive insertions.
- The sort functionality of the *Custom Equations* dialog did not work properly. One can click on the *Title* head to sort formulae.
- Some dialog windows were modal ones instead of non-modal. This prevented the selection of text in the editor during display of the dialog.
- The restore of window size and position was not reliable.

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
