export const buildDefaultName = (): string => {
    const date = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `Lienzo A4 – ${date}`;
  }