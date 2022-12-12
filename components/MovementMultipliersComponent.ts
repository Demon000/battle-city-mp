import { Component } from '@/ecs/Component';

export interface MovementTypeMultipliers {
    maxSpeed: number;
    accelerationFactor: number;
    decelerationFactor: number;
}

export interface MovementMultipliersComponentData {
    accelerationFactorMultiplier: number;
    decelerationFactorMultiplier: number;
    maxSpeedMultiplier: number;
    typeMultipliersMap: Record<string, MovementTypeMultipliers>;
    typeMultipliersMarkedMap: Record<string, boolean>;
}

export class MovementMultipliersComponent extends Component
    implements MovementMultipliersComponentData {
    static TAG = 'MM';

    accelerationFactorMultiplier = 1;
    decelerationFactorMultiplier = 1;
    maxSpeedMultiplier = 1;
    typeMultipliersMap: Record<string, MovementTypeMultipliers> = {};
    typeMultipliersMarkedMap: Record<string, boolean> = {};
}
