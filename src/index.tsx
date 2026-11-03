import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import { createRoot } from 'react-dom/client';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { Route, Routes } from 'react-router-dom';

import { StudioHeader } from '@edx/frontend-component-header';
import { StudioFooterSlot } from '@edx/frontend-component-footer';
import messages from './i18n';
import CourseFromRecordingPage from './course-from-recording/CourseFromRecordingPage';
import NotFoundPage from './not-found-page/NotFoundPage';

import './index.scss';

const queryClient = new QueryClient();

const container = document.getElementById('root');
const root = createRoot(container!);

subscribe(APP_READY, () => {
  root.render(
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <StudioHeader title="" isHiddenMainMenu isNewHomePage={false} />
        <main>
          {/* One route per tool; a tool's steps are screens inside its page, not separate routes. */}
          <Routes>
            <Route path="/course-from-recording/:courseId" element={<CourseFromRecordingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <StudioFooterSlot />
      </QueryClientProvider>
    </AppProvider>,
    document.getElementById('root'),
  );
});

subscribe(APP_INIT_ERROR, (error: { message: any }) => {
  root.render(<ErrorPage message={error.message} />, document.getElementById('root'));
});

initialize({
  messages,
  requireAuthenticatedUser: true,
});
