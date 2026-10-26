export function registrationPayload(values) {
  const payload = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;
    if (key === 'address_components') {
      for (const [part, text] of Object.entries(value)) {
        if (text !== null && text !== undefined) payload.append(`address_components[${part}]`, text);
      }
    } else payload.append(key, value);
  }
  return payload;
}
