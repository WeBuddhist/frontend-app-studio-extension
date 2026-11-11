import { apiErrorMessage } from './api';

describe('apiErrorMessage', () => {
  it('uses Studio\'s error, or the first field error', () => {
    expect(apiErrorMessage({ response: { data: { error: 'Job not found.' } } }, 'x')).toBe('Job not found.');
    expect(apiErrorMessage({ response: { data: { details: { teacher: ['Required.'] } } } }, 'x')).toBe('Required.');
  });

  it('never shows an error page to the author', () => {
    const page = '<html><head><title>502 Bad Gateway</title></head></html>';
    expect(apiErrorMessage({ response: { data: page } }, 'Try again later.')).toBe('Try again later.');
    expect(apiErrorMessage(new Error('Network Error'), 'Try again later.')).toBe('Try again later.');
  });
});
