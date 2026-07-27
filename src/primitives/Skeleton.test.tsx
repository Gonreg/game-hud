import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('рисует заданное число строк', () => {
    render(<Skeleton rows={3} />);
    expect(screen.getAllByTestId('hud-skeleton-row')).toHaveLength(3);
  });

  it('помечен для скринридера как «идёт загрузка»', () => {
    render(<Skeleton rows={1} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});
