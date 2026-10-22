// Registry mapping guide slug -> TSX body component.
// To add a body: create <slug>.tsx in this folder, import it here, add it to the map, and give
// the guide an entry in content/guides.ts (without `sections`). scripts/check-guides.mjs
// fails the build if the two drift apart.

import type { ComponentType } from 'react';

import PersonalisedChristmasPlaceSettings from './personalised-christmas-place-settings';

export const guideBodies: Record<string, ComponentType> = {
  'personalised-christmas-place-settings': PersonalisedChristmasPlaceSettings,
};
