export const ResponseStatus = {
  success: 'success',
  failed: 'failed',
  loading: 'loading',
} as const;

export type ResponseStatus = (typeof ResponseStatus)[keyof typeof ResponseStatus];

export const ViewState = {
  LOADING: 'loading',
  DATA: 'data',
  EMPTY: 'empty',
  ERROR:  'error',
} as const;

export type ViewState = typeof ViewState[keyof typeof ViewState];