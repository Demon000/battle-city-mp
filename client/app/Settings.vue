<template>
    <div class="settings">
        <div class="content-container">
            <div class="logo-container">
                <img src="../assets/images/logo.png" alt="" class="logo">
            </div>

            <div class="inputs-container inline">
                <div class="input-wrapper">
                    <label>Name</label>
                    <input
                        type="text"
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
                            :src="WebpackUtils.getImageUrl(`tank_${tier}`)"
                        >
                        <span>{{ tier }}</span>
                    </div>
                </div>

                <div v-if="selectedTierProperties">
                    <p>Health: {{ selectedTierProperties.maxHealth }}</p>
                    <p>Bullets: {{ selectedTierProperties.maxBullets }}</p>
                    <p>Bullet power: {{ selectedTierProperties.bulletPower }}</p>
                    <p>Bullet max speed: {{ selectedTierProperties.maxSpeed + selectedTierProperties.bulletSpeed }}</p>
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
                    v-if="isTankDead"
                >
                    <button
                        class="text-button"
                        @click="onSpawnButtonClick"
                    >
                        <template
                            v-if="hasTankDiedOnce"
                        >
                            RESPAWN
                        </template>
                        <template
                            v-else
                        >
                            SPAWN
                        </template>
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Color } from '@/drawable/Color';
import ColorUtils from '@/utils/ColorUtils';
import WebpackUtils from '@/client/utils/WebpackUtils';
import { TankTierProperties, tierToPropertiesMap } from '@/tank/Tank';
import { TankTier } from '@/tank/TankTier';
import { Vue, Prop, Watch, Options } from 'vue-property-decorator';
import Team from '@/team/Team';

@Options({
    emits: [
        'tank-tier-change',
        'tank-color-change',
        'player-name-change',
        'player-team-change',
        'spawn-click',
    ],
})
export default class Settings extends Vue {
    TankTier = TankTier;
    ColorUtils = ColorUtils;
    WebpackUtils = WebpackUtils;

    @Prop()
    hasTankDiedOnce = false;

    @Prop()
    isTankDead = false;

    @Prop()
    tankTier: TankTier | null = null;

    @Prop()
    tankColor: Color | null = null;

    @Prop()
    teams: Team[] | null = [];

    @Prop()
    playerTeamId: string | null = null;

    playerName: string | null = null;

    onTankTierChanged(tier: TankTier): void {
        this.$emit('tank-tier-change', tier);
    }

    onPlayerTeamChanged(teamId: string | null): void {
        this.$emit('player-team-change', teamId);
    }

    onSpawnButtonClick(): void {
        this.$emit('spawn-click');
    }

    get selectedTierProperties(): TankTierProperties | null {
        if (this.tankTier === null) {
            return null;
        }

        return tierToPropertiesMap[this.tankTier];
    }

    get hasTeams(): boolean {
        return this.teams !== null && this.teams.length !== 0;
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

.inputs-container.inline > * {
    display: inline-block;
    vertical-align: top;
}

.inputs-container.inline > .input-wrapper + .input-wrapper {
    margin-left: 16px;
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
    margin-right: 24px;
    margin-bottom: 24px;

    position: relative;

    cursor: pointer;
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
