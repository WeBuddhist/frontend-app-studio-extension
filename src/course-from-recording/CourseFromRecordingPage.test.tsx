import { IntlProvider } from '@edx/frontend-platform/i18n';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import CourseFromRecordingPage from './CourseFromRecordingPage';
import messages from './messages';

const renderAt = (path: string) => render(
  <IntlProvider locale="en">
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/course-from-recording/:courseId" element={<CourseFromRecordingPage />} />
      </Routes>
    </MemoryRouter>
  </IntlProvider>,
);

it('shows the tool for the course in the address', () => {
  renderAt('/course-from-recording/course-v1:Sherab+tspc12+2026');

  expect(screen.getByRole('heading', { name: messages.title.defaultMessage })).not.toBeNull();
  expect(screen.getByText('Course: course-v1:Sherab+tspc12+2026')).not.toBeNull();
});
