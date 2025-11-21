import { createMachine } from "xstate";

export const playwrightDevMachine = createMachine({
  id: "playwrightDev",
  predictableActionArguments: true,
  initial: "home",
  context: {
    currentPage: "home",
  },
  states: {
    home: {
      id: "home",
      on: {
        NAVIGATE_TO_DOCS: {
          target: "docs",
        },
        NAVIGATE_TO_API: {
          target: "#api",
        },
      },
    },
    docs: {
      id: "docs",
      initial: "overview",
      states: {
        overview: {
          id: "docs.overview",
          on: {
            NAVIGATE_TO_GETTING_STARTED: {
              target: "gettingStarted",
            },
            NAVIGATE_TO_API: {
              target: "#api",
            },
            NAVIGATE_TO_HOME: {
              target: "#home",
            },
          },
        },
        gettingStarted: {
          id: "docs.gettingStarted",
          on: {
            NAVIGATE_TO_OVERVIEW: {
              target: "overview",
            },
            NAVIGATE_TO_HOME: {
              target: "#home",
            },
          },
        },
      },
      on: {
        NAVIGATE_TO_API: {
          target: "#api",
        },
        NAVIGATE_TO_HOME: {
          target: "#home",
        },
      },
    },
    api: {
      id: "api",
      on: {
        NAVIGATE_TO_DOCS: {
          target: "#docs",
        },
        NAVIGATE_TO_HOME: {
          target: "#home",
        },
      },
    },
  },
});
