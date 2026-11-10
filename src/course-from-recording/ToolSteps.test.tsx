import { IntlProvider } from '@edx/frontend-platform/i18n';
import { render, screen } from '@testing-library/react';

import ToolSteps from './ToolSteps';
import messages from './messages';
import { stepsFor } from './steps';

const renderSteps = (multipleSpeakers: boolean, current: Parameters<typeof ToolSteps>[0]['current']) => render(
  <IntlProvider locale="en">
    <ToolSteps steps={stepsFor(multipleSpeakers)} current={current} />
  </IntlProvider>,
);

const names = () => screen.getAllByRole('listitem').map((item) => item.querySelector('.recording-steps__name')?.textContent);

it('shows every step, marks the current one, and ticks the finished ones', () => {
  renderSteps(true, 'clean');

  expect(names()).toEqual([
    'Upload', 'Find voices', 'Tag voices', 'Clean', 'Transcribe', 'Transcript', 'Shape course', 'Draft course',
  ]);
  expect(document.querySelector('[aria-current="step"]')?.textContent).toContain(messages.stepClean.defaultMessage);
  expect(screen.getAllByText(messages.stepDone.defaultMessage as string)).toHaveLength(3);
});

it('leaves out finding and tagging voices for one speaker', () => {
  renderSteps(false, 'upload');
  expect(names()).toEqual(['Upload', 'Clean', 'Transcribe', 'Transcript', 'Shape course', 'Draft course']);
});
