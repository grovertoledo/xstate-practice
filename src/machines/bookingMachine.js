import { assign, createMachine } from "xstate";
import { fetchCountries } from "../utils/api";

const fillCountries = {
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        id: 'getCountries',
        src: () => fetchCountries,
        onDone: {
          target: 'success',
          actions: assign({
            countries: (context, event) => event.data,
          }),
        },
        onError: {
          target: 'failure',
          actions: assign({
            error: 'Couldn\'t fetch country list' 
          })
        }
      }
    },
    success: {},
    failure: {
      on: {
        RETRY: { target: 'loading'}
      }
    }
  }
};

const bookingMachine = createMachine({
  id: "Buy plane tickets",
  initial: "initial",
  context: {
    passengers: [],
    selectedCountry: '',
    countries: [],
    error: '',
  },
  states: {
    initial: {
      on: {
        START: {
          target: 'search',
          // actions: 'printInitial',
        },
      },
    },
    search: {
      // entry: 'printTicket',
      // exit: 'printExit',
      on: {
        CONTINUE: {
          target: 'passengers',
          actions: assign({
            selectedCountry: (context, event) => event.selectedCountry,
          }),
        },
        CANCEL: {
          target: 'initial',
          actions: 'clearContext',
        },
      },
      ...fillCountries,
    },
    passengers: {
      on: {
        DONE: {
          target: 'tickets',
          cond: 'passengerFilled',
        },
        CANCEL: {
          target: 'initial',
          actions: 'clearContext',
        },
        ADD: {
          target: 'passengers',
          actions: assign(
            (context, event) => context.passengers.push(event.newPassenger),
          ),
        }
      }
    },
    tickets: {
      after: {
        20000: {
          target: 'initial',
          actions: 'clearContext',
        }
      },
      on: {
        FINISH: 'initial',
      }
    },
  },
},
{
  actions: {
    printInitial: () => console.log('Transition to search'),
    printTicket: () => console.log('Print entry'),
    printExit: () => console.log('Print exit'),
    cancel: (context) => {
      context.passengers = [];
      context.selectedCountry = '';
    },
    clearContext: assign({
      selectedCountry: '',
      passengers: [],
    }),
  }, 
  guards: {
    passengerFilled: (context) => {
      return context.passengers.length > 0;
    }
  },
});

export default bookingMachine;