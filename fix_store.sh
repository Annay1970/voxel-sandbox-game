#!/bin/bash
sed -i '1262s/setPlayerTakingBlockDamage/updateBlockDamageState/' client/src/lib/stores/useVoxelGame.tsx