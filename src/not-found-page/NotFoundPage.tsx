import { useIntl } from '@edx/frontend-platform/i18n';
import { Container } from '@openedx/paragon';

import messages from './messages';

const NotFoundPage = () => {
  const intl = useIntl();

  return (
    <Container size="sm">
      <p className="my-0 py-5 text-muted text-center mx-auto" data-testid="not-found-page">
        {intl.formatMessage(messages.message)}
      </p>
    </Container>
  );
};

export default NotFoundPage;
