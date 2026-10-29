import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockFetchFromPublic } from '../../tests/helpers/mockFetch';
import { PhoneDetail } from './PhoneDetail';

afterEach(() => vi.unstubAllGlobals());

const mainImage = (container: HTMLElement) => container.querySelector('img.phone.selected');
const specValue = (term: string) => screen.getByText(term, { selector: 'dt' }).nextElementSibling?.textContent;

describe('<PhoneDetail>', () => {
  it('shows the phone and its specifications', async () => {
    mockFetchFromPublic();
    render(<PhoneDetail phoneId="nexus-s" />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Nexus S' })).toBeInTheDocument();
    expect(specValue('RAM')).toBe('512MB');
    expect(specValue('GPS')).toBe('✓');
    expect(specValue('Infrared')).toBe('✘');
    expect(specValue('Features')).toBe('Flash, Video');
  });

  it('starts with the first image and swaps it when a thumbnail is clicked', async () => {
    mockFetchFromPublic();
    const user = userEvent.setup();
    const { container } = render(<PhoneDetail phoneId="nexus-s" />);
    await screen.findByRole('heading', { level: 1 });
    expect(mainImage(container)).toHaveAttribute('src', 'img/phones/nexus-s.0.jpg');

    const thumbs = container.querySelectorAll<HTMLImageElement>('.phone-thumbs img');
    await user.click(thumbs[2]!);
    expect(mainImage(container)).toHaveAttribute('src', 'img/phones/nexus-s.2.jpg');
  });

  it('says so when the phone does not exist (new: the original showed an empty page)', async () => {
    mockFetchFromPublic();
    render(<PhoneDetail phoneId="no-such-phone" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not find that phone');
  });

  it('says so when the phone cannot be loaded', async () => {
    mockFetchFromPublic({ 'phones/nexus-s.json': 500 });
    render(<PhoneDetail phoneId="nexus-s" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not load this phone');
  });
});
