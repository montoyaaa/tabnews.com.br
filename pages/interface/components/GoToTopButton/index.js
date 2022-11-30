import { ChevronUpIcon } from '@primer/octicons-react';
import { IconButton } from '@primer/react';
import { useEffect, useState } from 'react';

export default function GoToTopButton() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.pageYOffset);
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    offset != 0 && (
      <IconButton
        variant="invisible"
        aria-label="Retornar ao topo"
        icon={ChevronUpIcon}
        size="large"
        sx={{ color: 'fg.subtle', lineHeight: '18px' }}
        onClick={() => {
          const html = document.querySelector('html');

          html.style.scrollBehavior = 'smooth';
          html.scrollTop = 0;
        }}
      />
    )
  );
}
