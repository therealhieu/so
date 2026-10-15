import { join } from "node:path";
import { copyFixture, type Profile, writeFiles } from "../profile";

export const browser: Profile = {
  name: "browser",
  summary:
    "Browser view: a showcase page with visuals, forms, mouse, keys, and motion",
  journeys: [
    {
      title: "See the page",
      steps: [
        "Open site/index.html",
        "Press j, k, G, gg; press + twice, then 0",
        "Hover the Hover me card",
      ],
      expect: [
        "The statusline shows WEB and so browser showcase; the clock ticks",
        "The page scrolls like a browser's; + grows the text, 0 resets it",
        "The card lifts and turns pink under the pointer",
      ],
    },
    {
      title: "Links and history",
      steps: [
        "Click Forms in the top bar, then Gallery →",
        "Press H twice, then L",
        "Press i, then Tab until a link is focused, Enter; press Ctrl-\\ Ctrl-N",
      ],
      expect: [
        "Forms scrolls to its section; Gallery opens the tile page",
        "H walks back to the forms section, then the top; L goes forward",
        "BROWSE shows while keys go to the page; WEB returns after Ctrl-\\ Ctrl-N",
      ],
    },
    {
      title: "Forms",
      steps: [
        "Click the Name box and type a name",
        "Click Notes and type two lines",
        "Click a radio, a checkbox, and drag the Volume slider",
        "Click Clicked 0 times three times, then Submit",
        "Click Open dialog, then Close",
      ],
      expect: [
        "A click into a field switches to BROWSE; the title shows the name as typed",
        "The character count follows the text",
        "The radio and box change; the green bar follows the slider",
        "The button counts 3; the result box shows the form as JSON",
        "The dialog dims the page and closes",
      ],
    },
    {
      title: "Mouse",
      steps: [
        "Move the pointer over the striped pad",
        "Double-click the lamp twice",
        "Drag Drag me below Third",
        "Click the tabs and Click to expand; click into the dashed note and type",
        "Drag across the sentence under the chart, press y, paste elsewhere",
      ],
      expect: [
        "The pad shows the pointer's x and y",
        "The lamp switches off and on",
        "The list reorders; the title lists the new order",
        "Tabs switch, the details open, and the note takes the text",
        "y says copied N characters; the paste is the sentence",
      ],
    },
    {
      title: "Keys and data",
      steps: [
        "Click the Keys box, press i, then ←, Tab, Ctrl-K, Alt-x; Ctrl-\\ Ctrl-N",
        "Type in Filter the table; click Words twice",
        "Scroll the numbered strip with Shift-wheel",
      ],
      expect: [
        "The log lists each key with its modifiers and code",
        "Rows filter as you type; Words sorts up, then down",
        "The strip moves sideways",
      ],
    },
    {
      title: "Motion, and inside herdr",
      steps: [
        "Click Start animation; after a while click Stop animation",
        "Repeat inside herdr: run so in a herdr pane on the same page",
      ],
      expect: [
        "Balls bounce and the spinner turns; typing and clicks still respond",
        "Inside herdr the page updates more slowly while animating, but keys never stall",
      ],
    },
    {
      title: "Source",
      steps: ["Press Space m; change the <h1> text; :w; press Space m"],
      expect: [
        "The source shows as HTML; after the save the page shows the new heading",
      ],
    },
  ],
  stage(vault) {
    copyFixture("browser-site", join(vault, "site"));
    writeFiles(vault, {
      "README.md":
        "# Browser view\n\nOpen `site/index.html` from the explorer. It needs Chrome or Chromium.\n",
    });
  },
};
