# Known Problems

## Start Problem

The Katex Input Helper plug-in has a start problem. This problem manifests itself in the following behavior (investigated in Joplin v3.3.10 at a Windows 11 installation):

- Immediately after Joplin start the dialog invocation brings a message "Error: &laquo;*Component*&raquo; not loaded".
- The only option is to close the dialog
- Then, in Joplin again, there is no Caret. Entering text is not possible.

In this stage the following work-around helps:

- Switch the Developer Tools on and off.
- Then invoke the plug-in again. It should work now.
- Also input in Joplin is possible again.
- If this does not help, repeat the procedure.

All the behavior happens equally in developer mode.

I believe that this problem is caused by Joplin's handling of JS code loaded into dialogs. Also one has no control over the process of loading.
