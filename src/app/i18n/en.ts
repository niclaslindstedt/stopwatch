// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The English catalog — the app's single source of user-facing copy, and (as
// the fallback language) the source of the compile-time message-key type. Add
// a string here first; `t()` won't type-check against a key this file doesn't
// carry.
//
// `{name}`-style placeholders interpolate at call time. Keep the surrounding
// sentence in the catalog rather than concatenating fragments at the call
// site: a translator needs the whole sentence to move its words around.

import { APP_NAME } from "../appName.ts";

export const en = {
  app: {
    // The listing's name in an app build, the project's on the website (see
    // `appName.ts`) — which is why the sentences that name the app below are
    // templates over it.
    name: APP_NAME,
    tagline: "Stopwatches and timers, on your device",
  },

  nav: {
    watch: "Watch",
    stopwatches: "Stopwatches",
    timers: "Timers",
    settings: "Settings",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    rename: "Rename",
    name: "Name",
    // A file the phone could not hand to the share sheet (the website's
    // download cannot fail this way).
    exportFailed: "Could not export {file}: {reason}",
  },

  // The main screen: the dial, the two tabs over it, the controls under it,
  // and the ones still running below. Every label here is read one-handed,
  // with a pan in the other, so they are short.
  watch: {
    tabs: "Stopwatch or timer",
    stopwatch: "Stopwatch",
    timer: "Timer",
    // The word a stopwatch is called when it is made, and a timer: "Stopwatch
    // 3", "Timer 2". The reader renames it on its page.
    stopwatchWord: "Stopwatch",
    timerWord: "Timer",
    // The movement's word, printed under the name on the dial the way a
    // watch prints AUTOMATIC under its maker's.
    calibre: {
      quartz: "Quartz",
      mechanical: "Automatic",
      sweep: "Glide",
    },
    clockLabel: "Stopwatch dial",
    clockDesc:
      "A stopwatch face: the big hand counts the seconds, the small dial at three the minutes, and the one at nine the hours.",
    timerDesc:
      "A timer on a stopwatch face, counting down: the big hand is the seconds left, the small dial at three the minutes, the one at nine the hours, and the bezel the share still to run.",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    stop: "Put away",
    restart: "Start again",
    new: "New",
    newStopwatch: "New stopwatch",
    newTimer: "New timer",
    // What the dial's button says it will do.
    startName: "Start {name}",
    pauseName: "Pause {name}",
    resumeName: "Resume {name}",
    dismissName: "Silence {name}",
    // The line under the dial, before anything is running.
    hintStopwatch: "Press the dial to start",
    hintTimer: "Set the time, then press the dial",
    state: {
      running: "Running",
      paused: "Paused",
      idle: "Ready",
      done: "Time's up",
      stopped: "Put away",
    },
    hours: "Hours",
    minutes: "Minutes",
    hoursShort: "h",
    minutesShort: "min",
    more: "More {what}",
    less: "Fewer {what}",
    setFor: "Set for {duration}",
    rings: "Rings at {time}",
    ringing: "Time's up",
    // Below the dial: the ones not put away. A scroll down from the watch.
    activeStopwatches: "Running stopwatches",
    activeTimers: "Running timers",
    noneActiveStopwatches: "No other stopwatch is running.",
    noneActiveTimers: "No other timer is running.",
    allStopwatches: "All stopwatches",
    allTimers: "All timers",
    onDial: "On the dial",
    show: "Show {name} on the dial",
    // The browser tab's title while something runs.
    tabTitle: "{reading} · {name} — {app}",
    // A timer that ran out, said once as a notice.
    doneNotice: "{name}: time's up",
  },

  // The two pages: every stopwatch, and every timer, whether running or put
  // away. Where they are named, and where a stopped one is started again.
  list: {
    stopwatchesIntro:
      "Every stopwatch you have, running or put away. Press a name to rename it.",
    timersIntro:
      "Every timer you have, running or put away. Press a name to rename it.",
    emptyStopwatches:
      "No stopwatches yet. Press the dial on the watch to start one.",
    emptyTimers: "No timers yet. Set one on the watch and press the dial.",
    active: "Active",
    stopped: "Put away",
    renameLabel: "Name of {name}",
    deleteConfirm: "Delete {name}?",
    deleteHint: "It is removed from every device it syncs to.",
    deleted: "{name} deleted",
    showOnDial: "Show on the dial",
  },

  settings: {
    title: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "Device",
    clock: "The dial",
    clockHint:
      "The stopwatch face your stopwatches and timers are drawn on. Each one comes with the light that suits it. Pick one of the presets, or Custom and put one together: the face, the markers, the numerals and their size, where they sit against the dial's ring, what that ring is, what the hands are, how the seconds hand moves, and the light behind the case.",
    clockPreset: "Dial",
    clockCustom: "Custom",
    clockCustomHint: "Your own dial and its light, piece by piece.",
    // The nine presets, named for what they look like.
    preset: {
      snowfield: "Snowfield",
      abyss: "Abyss",
      trailhead: "Trailhead",
      summit: "Summit",
      boulevard: "Boulevard",
      studio: "Studio",
      tidewater: "Tidewater",
      harvest: "Harvest",
      uptown: "Uptown",
    },
    presetHint: {
      snowfield: "Textured silver, applied batons, a hand that glides.",
      abyss: "The diver: black, dots, a triangle at twelve.",
      trailhead:
        "The field watch: every five seconds numbered, tall and clear.",
      summit: "The expedition dial: 15, 30 and 45.",
      boulevard: "The dress watch: white, Roman numerals, a quiet tick.",
      studio: "Small geometric numerals at the rim, and nothing else.",
      tidewater: "Blue sunburst, tapered wedges.",
      harvest: "Champagne, numerals at the quarters in a serif.",
      uptown:
        "The sixties dress watch: silver blocks out to the ring, tapered steel hands, the seconds on a blue ring.",
    },
    clockFace: "Face",
    face: {
      white: "White",
      silver: "Silver",
      slate: "Slate",
      black: "Black",
      blue: "Blue",
      green: "Green",
      burgundy: "Burgundy",
      champagne: "Champagne",
    },
    clockMarkers: "Markers",
    markers: {
      batons: "Batons",
      blocks: "Blocks",
      dots: "Dots",
      numerals: "Numerals",
      roman: "Roman",
      quarters: "Quarters",
      threeSixNine: "15 · 30 · 45",
      wedges: "Wedges",
      ticks: "Ticks",
    },
    clockFont: "Numerals",
    font: {
      grotesque: "Grotesque",
      light: "Light",
      geometric: "Geometric",
      condensed: "Condensed",
      engineered: "Engineered",
      serif: "Serif",
      didone: "Didone",
      inscribed: "Inscribed",
      mono: "Mono",
    },
    clockScale: "Marker size",
    clockPlacement: "Markers sit",
    placement: {
      outside: "Outside the ring",
      over: "Over the ring",
      inside: "Inside the ring",
    },
    // The dial's own ring — the track the seconds are read against.
    clockRing: "The dial's ring",
    ring: {
      groove: "A groove",
      chapter: "Seconds ring",
    },
    ringHint: {
      groove: "A faint sunken track for the markers to stand against.",
      chapter:
        "A blue ring printed with the seconds, the way a sixties dress watch wears one. It takes the outside of the dial, so the markers sit inside it.",
    },
    clockHands: "Hands",
    hands: {
      bar: "Bars",
      tapered: "Tapered",
    },
    handsHint: {
      bar: "The same width from the cap to the tip, a half-round bar of steel.",
      tapered:
        "The tapered hands of a dress watch, broad where they leave the cap and narrowing to a point, with a ridge down each that takes the light on one side, and a long blade balancing the seconds hand.",
    },
    clockMovement: "Movement",
    movement: {
      quartz: "Quartz",
      mechanical: "Mechanical",
      sweep: "Glide",
    },
    movementHint: {
      quartz: "The seconds hand steps once a second.",
      mechanical:
        "Eight small steps a second, the way a mechanical caliber beats.",
      sweep: "The seconds hand glides around without a step.",
    },
    clockSize: "Size",
    clockSizeHint:
      "How much of the screen the dial takes: on a phone a share of the width, on a desk a share of the window's height — about half of it, most of it, or nearly all of it.",
    clockSizeSmall: "Small",
    clockSizeMedium: "Medium",
    clockSizeLarge: "Large",
    reflect: "Reflections",
    reflectHint:
      "Move the light on the dial's metal as you turn the device, the way a watch on your wrist catches it. Needs the motion sensors; the readings are used for the next frame and nothing else — they are never stored or sent.",
    reflectDenied:
      "The device did not allow access to its motion sensors, so the light stays where it is. You can allow it in the browser's settings for this site and try again.",
    // The light behind the dial.
    backlight: "Backlight",
    backlightHint:
      "A light behind the case while the watch on the dial is running, the way a television lights the wall behind it. It beats while it counts, turns the warning colour when a timer runs out, and is off while it is held.",
    backlightColor: "Color",
    backlightColorName: {
      accent: "Theme",
      white: "White",
      amber: "Amber",
      green: "Green",
      teal: "Teal",
      blue: "Blue",
      violet: "Violet",
      rose: "Rose",
    },
    backlightBeat: "Beat",
    backlightSteady: "Steady",
    backlightHz: "{hz} Hz",
    backlightIntensity: "Brightness",
    backlightSpread: "Spread",
    backlightSpreadHint:
      "How far the light reaches past the case. Turn it down if the glow runs into the bars around a large dial.",
    backlightFaceHint:
      "Every face comes with a light of its own — warm behind the dark dials, quiet behind the pale ones. Picking a face above brings its light with it; change it here afterwards if you want another.",
    backlightOff: "Off",
    backlightPercent: "{percent}%",
    calendar: "Clock",
    hourClock: "Times of day",
    hourClockAuto: "Automatic",
    hourClock12: "7:26 PM",
    hourClock24: "19:26",
    hourClockHint:
      "How a timer says when it will ring. Automatic follows your device's region.",
    alarm: "When a timer runs out",
    alarmHint:
      "The dial lights up and a notice says so. A chime and a buzz can come with it, if the device has them and the app is open.",
    alarmSound: "Chime",
    alarmVibrate: "Vibrate",
    sync: "Cloud sync",
    syncHint:
      "Off by default. Connect your own Dropbox, or a storage server you run yourself, to keep a copy there and sync between devices.",
    // The same sentence with iCloud in it, shown only where the app has a
    // store to offer — which is the app-store build. A browser has none, so
    // naming iCloud there would be offering something that is not on the
    // picker below it.
    syncHintICloud:
      "Off by default. Keep a copy in your own iCloud, Dropbox or storage server to sync between devices.",
    backend: "Storage",
    connected: "Connected to {name}",
    localOnly: "Kept on this device only",
    saveNow: "Save now",
    reload: "Reload",
    disconnect: "Disconnect",
    data: "Your data",
    export: "Download a backup",
    exportHint: "A JSON file with every stopwatch and every timer.",
    import: "Restore a backup",
    importHint:
      "Merges the file into what is here — the newer copy of each one wins.",
    imported: "Restored {count} new stopwatches and timers",
    importFailed: `That file is not a ${APP_NAME} backup.`,
    deleteAll: "Delete everything",
    deleteAllHint:
      "Removes every stopwatch and timer from this device. A connected cloud copy is not touched.",
    deleteAllConfirm: "Delete everything on this device?",
    deleted: "Everything deleted",
    developer: "Developer",
    devMode: "Developer mode",
    devModeHint: "Show demo data, the log panel and the document size.",
    demoData: "Demo data",
    demoDataHint:
      "Swap in an invented afternoon of stopwatches and timers for this session. Nothing on this device or in the cloud is touched; a reload restores your own.",
    demoDataOn: "Showing demo data",
    demoDataOff: "Back to your own data",
    captureLogs: "Capture console output",
    captureLogsHint: "Mirror console messages into the log panel below.",
    documentSize: "Document size",
    about: "About",
    version: "Version",
    build: "Build",
    privacy: `${APP_NAME} keeps your stopwatches and timers on this device. Nothing is sent anywhere unless you connect your own cloud account or storage server, and then only there. In the phone app, the camera is used only when you tap Scan to read a pairing code, and no picture is kept.`,
  },

  sync: {
    syncedTo: "Synced to {name}",
  },

  selfHosted: {
    title: "Connect to your server",
    intro:
      "A storage server you run yourself — at home or on a host you choose. Your stopwatches are encrypted on this device before they leave it; the server only ever holds ciphertext.",
    codeLabel: "Pairing code",
    codeHint:
      "Make one in your server's admin console (Accounts → Pair device) or with storage-server pair, then scan its QR code with this phone's camera or paste the link here. A code from one of your other devices works too.",
    // The phone app, where the sheet offers its own scanner: the phone's
    // camera app would open the code's link in the browser, not here.
    codeHintScan:
      "Make one in your server's admin console (Accounts → Pair device) or with storage-server pair, then tap Scan and point this phone at its QR code — or paste the link here. A code from one of your other devices works too.",
    scan: "Scan",
    scanHint: "Point the camera at the pairing code",
    scanDenied:
      "Camera access is off for this app. Allow it in Settings, or paste the code.",
    scanUnavailable: "The camera could not be opened. Paste the code instead.",
    scanInvalid: "That QR code is not a pairing code.",
    codePlaceholder: "oss-storage://pair?…",
    deviceLabel: "This device's name",
    connect: "Connect",
    codeEmpty: "Paste or scan a pairing code first.",
    codeInvite:
      "That is an invite to someone's shared space, not a pairing code for this device.",
    codeInvalid: "That is not a pairing code: {reason}",
    codeInvalidPlain: "That is not a pairing code.",
    pairing: "Pairing with {server}…",
    newAccountTitle: "Make your keys",
    newAccount: `This is the first device on this account. ${APP_NAME} will now make the encryption key for your stopwatches — here, on this device. The server never sees it.`,
    makeKeys: "Make my keys",
    recoveryTitle: "Your recovery key",
    recovery:
      "Write this down or store it in your password manager. It is the only way back to your stopwatches if you lose every device, and nobody — not the server, not us — can recover it for you.",
    copy: "Copy",
    copied: "Copied",
    savedIt: "I have stored my recovery key somewhere safe",
    done: "Done",
    existingTitle: "Get your keys",
    existing:
      "This account already has keys on another device. Approve this device there — Settings → Your server → Approve — and check it shows this code:",
    waiting: "Waiting for approval…",
    orRecovery: "Or type your recovery key",
    recoveryPlaceholder: "XXXX-XXXX-…",
    recover: "Use recovery key",
    recoverFailed: "That recovery key does not match this account.",
    server: "Server",
    addDevice: "Add a device",
    addDeviceTitle: "Add a device",
    addDeviceHint: `Scan this with your other phone's camera, or paste the link into ${APP_NAME} there. It works once, for {minutes} minutes, and carries your keys — show it only to your own devices.`,
    expires: "Expires in {time}",
    expired: "Expired — close and make a new one",
    approvals: "Waiting for approval",
    approvalsHint:
      "Approve only a device you are holding, and only if it shows the same code.",
    approve: "Approve",
    noApprovals: "No device is waiting.",
    checkApprovals: "Check for devices",
    newRecovery: "Make a new recovery key",
    newRecoveryConfirm: "Make a new recovery key?",
    newRecoveryHint:
      "The old one stops working. Store the new one before you close this.",
    unpair: "Unpair this device",
    unpairConfirm: "Unpair this device?",
    unpairHint:
      "Its keys are erased from this device, so it must be paired again to sync. Your stopwatches stay on this device and on the server.",
    unreachable: "Server unreachable — working on this device's copy",
    needsKeys: "Paired, waiting for this device's keys",
    finish: "Finish connecting",
  },

  update: {
    available: "A new version is ready",
    reload: "Reload",
  },
} as const;

export type Catalog = typeof en;
