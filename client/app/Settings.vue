<template>
    <div class="settings">
        <div class="content-container">
            <div class="logo-container">
                <img src="/assets/images/logo.png" alt="" class="logo">
            </div>

            <div class="inputs-container inline">
                <div class="input-wrapper">
                    <label>Name</label>
                    <input
                        type="text"
                        maxlength="16"
                        v-model.lazy="playerName"
                    >
                </div>

                <div
                    class="input-wrapper"
                    v-if="tankColor && !hasTeams"
                >
                    <label>Color</label>
                    <input
                        type="color"
                        v-model.lazy="rgbTankColor"
                    >
                </div>
            </div>

            <div class="tank-tiers-container">
                <label>
                    Tier
                </label>

                <div class="tank-tiers">
                    <div
                        class="tier retro-border retro-arrow"
                        v-for="tier in Object.values(TankTier)"
                        @click="onTankTierChanged(tier)"
                        :key="tier"
                        :class="{
                            selected: tier === tankTier,
                        }"
                    >
                        <img
                            class="tier-image"
                            :src="`/assets/images/tank_${tier}.png`"
                        >
                        <span>{{ tier }}</span>
                    </div>
                </div>
            </div>
        
            <div
                class="player-teams-container"
                v-if="hasTeams"
            >
                <label>Team</label>

                <div class="player-teams">
                    <div
                        class="team retro-border retro-arrow"
                        v-for="team in teams"
                        @click="onPlayerTeamChanged(team.id)"
                        :key="team.id"
                        :class="{
                            selected: playerTeamId === team.id,
                        }"
                    >
                        <div
                            class="team-color retro-border retro-border-black"
                            :style="{
                                background: ColorUtils.getRgbFromColor(team.color),
                            }"
                        >
                        </div>
                        <span>{{ team.id }}</span>
                    </div>

                    <div
                        class="team retro-border retro-arrow"
                        @click="onPlayerTeamChanged(null)"
                        :class="{
                            selected: playerTeamId === null,
                        }"
                    >
                        <div
                            class="team-color retro-border retro-border-black"
                            :style="{
                                background: '#ffffff',
                            }"
                        >
                        </div>
                        <span>Auto</span>
                    </div>
                </div>
            </div>

            <div class="spawn-button-container">
                <template
                    v-if="isPlayerDead"
                >
                    <button
                        class="text-button"
                        @click="onSpawnButtonClick"
                    >
                        {{ respawnString }}
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Color } from '@/drawable/Color';
import { ColorUtils } from '@/utils/ColorUtils';
import { TankTier } from '@/subtypes/TankTier';
import { Vue, Prop, Watch, Component } from 'vue-facing-decorator';
import { Team } from '@/team/Team';
import { PlayerSpawnStatus } from '@/player/Player';

@Component({
    options: {
        emits: [
            'tank-tier-change',
            'tank-color-change',
            'player-name-change',
            'player-team-change',
            'spawn-click',
            'escape-keyup',
        ],
    },
})
export default class Settings extends Vue {
    TankTier = TankTier;
    ColorUtils = ColorUtils;

    @Prop()
    hasTankDiedOnce = false;

    @Prop()
    isPlayerDead = false;

    @Prop()
    tankTier: TankTier | null = null;

    @Prop()
    tankColor: Color | null = null;

    @Prop()
    teams: Team[] | null = [];

    @Prop()
    hasTeams = false;

    @Prop()
    playerTeamId: string | null = null;

    @Prop()
    playerRequestedSpawnStatus: PlayerSpawnStatus | null = null;

    @Prop()
    playerRespawnTimeout: number | null = null;

    playerName: string | null = null;

    mounted(): void {
        this.$el.addEventListener('keydown', this.onKeyboardEvent);
        this.$el.addEventListener('keyup', this.onKeyboardEvent);
    }

    onKeyboardEvent(event: KeyboardEvent): void {
        const lowerKey = event.key.toLowerCase();
        let repeated = event.repeat;
        let handled = false;

        const target = event.target as HTMLElement;
        if (target !== null && target.tagName.toLowerCase() === 'input') {
            return;
        }

        if (lowerKey === 'tab') {
            handled = true;
        }

        if (!repeated && lowerKey === ' ') {
            if (event.type === 'keyup' && this.isPlayerDead) {
                this.$emit('spawn-click');
            }
            handled = true;
        }

        if (!repeated && lowerKey === 'escape') {
            if (event.type === 'keyup') {
                this.$emit('escape-keyup', event);
            }
            handled = true;
        }

        if (handled) {
            event.preventDefault();
        }
    }

    onTankTierChanged(tier: TankTier): void {
        this.$emit('tank-tier-change', tier);
    }

    onPlayerTeamChanged(teamId: string | null): void {
        this.$emit('player-team-change', teamId);
    }

    onSpawnButtonClick(): void {
        this.$emit('spawn-click');
    }

    get rgbTankColor(): string | null {
        if (this.tankColor === null) {
            return null;
        }

        return ColorUtils.getRgbFromColor(this.tankColor);
    }

    set rgbTankColor(rgb: string | null) {
        if (rgb === null) {
            return;
        }

        const color = ColorUtils.getColorFromRgb(rgb);
        this.$emit('tank-color-change', color);
    }

    get respawnString(): string {
        let str = '';

        if (this.hasTankDiedOnce) {
            str += 'Respawn';
        } else {
            str += 'Spawn';
        }

        if (this.playerRequestedSpawnStatus === PlayerSpawnStatus.SPAWN) {
            str += 'ing ';
        }

        if (this.playerRespawnTimeout !== null) {
            if (this.playerRespawnTimeout === 0) {
                str += 'now';
            } else {
                str += `in ${this.playerRespawnTimeout} seconds`;
            }
        }

        return str.toUpperCase();
    }

    @Watch('playerName')
    onPlayerNameChanged(): void {
        this.$emit('player-name-change', this.playerName);
    }
}
</script>

<style scoped>
@import url(../css/style.css);

.settings {
    background: rgba(0, 0, 0, 0.75);

    color: #ffffff;
    font-family: 'Press Start 2P';

    display: flex;
    justify-content: center;

    overflow: auto;
}

.logo-container {
    width: 100%;

    margin-bottom: 32px;
}

.logo {
    width: 100%;

    padding-top: 5%;

    image-rendering: pixelated;
}

.content-container {
    display: inline-block;

    padding: 16px;
}

.spawn-button-container {
    display: flex;

    justify-content: center;

    padding: 32px;
}


.inputs-container.inline {
    display: flex;
    vertical-align: top;
}

.inputs-container.inline > .input-wrapper + .input-wrapper {
    margin-left: 16px;
}

.tank-tiers-container .tank-tiers {
    display: flex;
    justify-content: space-between;
}

.tank-tiers-container label,
.player-teams-container label {
    display: block;
    margin-bottom: 8px;
}

.tank-tiers-container .tier,
.player-teams-container .team {
    display: inline-flex;
    flex-direction: column;
    align-items: center;

    box-sizing: border-box;
    padding: 16px;
    margin-bottom: 24px;

    position: relative;

    cursor: pointer;
}

.tank-tiers-container .tier + .tier,
.player-teams-container .team + .team {
    margin-left: 24px;
}

.player-teams-container .team.selected,
.tank-tiers-container .tier.selected {
    background: #ffffff;
    color: #000000;
}

.tank-tiers-container .tier .tier-image,
.player-teams-container .team .team-color {
    width: 80px;
    height: 80px;

    margin-bottom: 8px;

    image-rendering: pixelated;
}

.tank-tiers-container .tank-tiers {
    margin-bottom: 16px;
}
</style>>
