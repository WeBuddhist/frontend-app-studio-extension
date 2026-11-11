import { IntlProvider } from '@edx/frontend-platform/i18n';
import { render, screen } from '@testing-library/react';

import NotFoundPage from './NotFoundPage';
import messages from './messages';

it('shows the page-not-found message', () => {
  render(
    <IntlProvider locale="en">
      <NotFoundPage />
    </IntlProvider>,
  );

  expect(screen.getByText(messages.message.defaultMessage)).not.toBeNull();
});
