import GameObject from '@/object/GameObject';
import { RenderPass } from '@/object/RenderPass';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import CanvasUtils, { Context2D } from '@/utils/CanvasUtils';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import GameObjectGraphicsRendererFactory from '../object/GameObjectGraphicsRendererFactory';
import { Color3, StandardMaterial, Engine, MeshBuilder, Scene, Vector3, ArcRotateCamera, DirectionalLight, ShadowGenerator } from 'babylonjs';
import PointUtils from '@/physics/point/PointUtils';

export default class GameGraphicsService {
    private rendererFactory;
    private is3d;
    private scale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private canvases;
    private contexts!: Context2D[];
    private canvasX = 0;
    private canvasY = 0;
    private targetGameSize;
    private showInvisible = false;
    private scene?: Scene;
    private camera?: ArcRotateCamera;
    private shadowGenerator?: ShadowGenerator;
    private point: Point = {
        x: 0,
        y: 0,
    };

    constructor(
        rendererFactory: GameObjectGraphicsRendererFactory,
        canvases: HTMLCanvasElement[],
        targetGameSize: number,
        is3d: boolean,
    ) {
        this.rendererFactory = rendererFactory;
        this.canvases = canvases;
        this.targetGameSize = targetGameSize;
        this.is3d = is3d;

        this.calculateDimensions();
        if (is3d) {
            this.initialize3d();
        } else {
            this.initialize2d();
        }
    }

    private initialize3d(): void {
        const engine = new Engine(this.canvases[0], true, {
            preserveDrawingBuffer: true,
            stencil: true,
        });
        engine.inputElement = this.canvases[this.canvases.length - 1];

        this.scene = new Scene(engine);
        this.camera = new ArcRotateCamera('camera', 0, 0, 0, new Vector3(0, 0, 0), this.scene);
        this.camera.attachControl();

        const light = new DirectionalLight('light', new Vector3(-1, -2, -1), this.scene);
        light.diffuse = new BABYLON.Color3(1, 1, 1);
        light.specular = new BABYLON.Color3(0.5, 0.5, 0.25);
        light.intensity = 2;

        const groundMaterial = new StandardMaterial('material', this.scene);
        groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
        groundMaterial.specularColor = new Color3(0.25, 0.25, 0.25);

        const ground = MeshBuilder.CreateGround('ground', {
            width: 1024,
            height: 1024,
        }, this.scene);

        ground.position.x = -512;
        ground.position.z = 512;
        ground.position.y = 0;
        ground.material = groundMaterial;
        ground.receiveShadows = true;

        this.shadowGenerator = new ShadowGenerator(4096, light);
        this.shadowGenerator.useExponentialShadowMap = true;
        this.shadowGenerator.useContactHardeningShadow = true;
        this.shadowGenerator.useKernelBlur = true;
        this.shadowGenerator.blurKernel = 64;
        this.shadowGenerator.setDarkness(0.5);
    }

    private initialize2d(): void {
        this.contexts = new Array<Context2D>();

        for (const canvas of this.canvases) {
            const context = CanvasUtils.getContext(canvas);
            context.imageSmoothingEnabled = false;
            this.contexts.push(context);
        }
    }

    calculateDimensions(): void {
        const ratio = window.devicePixelRatio;
        const visibleWidth = window.innerWidth;
        const visibleHeight = window.innerHeight;
        const width = Math.ceil(visibleWidth * ratio);
        const height = Math.ceil(visibleHeight * ratio);

        for (const canvas of this.canvases) {
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${visibleWidth}px`;
            canvas.style.height = `${visibleHeight}px`;
        }

        const minRenderSize = Math.min(width, height);
        this.scale = Math.ceil(minRenderSize / this.targetGameSize);

        this.gameWidth = width / this.scale;
        this.gameHeight = height / this.scale;

        this.gameWidth -= this.gameWidth % 2;
        this.gameHeight -= this.gameHeight % 2;
    }

    setShowInvisible(showInvisible: boolean): void {
        this.showInvisible = showInvisible;
    }

    findObjectRenderer(object: GameObject): GameObjectGraphicsRenderer | undefined {
        return object.graphicsRenderer;
    }

    destroyObjectRenderer(object: GameObject): void {
        const renderer = this.findObjectRenderer(object);
        if (renderer === undefined) {
            return;
        }

        if (renderer.scene !== undefined && renderer.mesh !== undefined) {
            renderer.scene.removeMesh(renderer.mesh);
            this.shadowGenerator?.removeShadowCaster(object.graphicsRenderer.mesh);
        }
    }

    getObjectRenderer(object: GameObject): GameObjectGraphicsRenderer {
        if (object.graphicsRenderer === undefined) {
            object.graphicsRenderer = this.rendererFactory
                .buildFromObject(object, this.scene);
            this.shadowGenerator?.addShadowCaster(object.graphicsRenderer.mesh);
        }

        return object.graphicsRenderer;
    }

    renderObject(object: GameObject): void {
        const renderer = this.getObjectRenderer(object);
        const objectRelativeX = Math.floor(object.position.x) - this.canvasX;
        const objectRelativeY = Math.floor(object.position.y) - this.canvasY;
        const objectDrawX = objectRelativeX * this.scale;
        const objectDrawY = objectRelativeY * this.scale;
        renderer.render(this.contexts,
            objectDrawX, objectDrawY, this.showInvisible);
    }

    renderObjectsOver(objects: Iterable<GameObject>): void {
        for (const object of objects) {
            const renderer = this.getObjectRenderer(object);
            renderer.update(this.scale);
            if (renderer.isRenderable()) {
                this.renderObject(object);
            }
        }
    }

    initializeRender3d(point: Point): void {
        if (this.scene === undefined || this.camera === undefined) {
            return;
        }

        if (!PointUtils.equal(point, this.point)) {
            this.camera.setPosition(new Vector3(-point.x, this.targetGameSize, point.y));
            this.camera.setTarget(new Vector3(-point.x, 0, point.y));
            this.point = point;
        }

        this.scene.render();
    }

    initializeRender2d(point: Point): void {
        for (const context of this.contexts) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        }

        this.canvasX = point.x - this.gameWidth / 2;
        this.canvasY = point.y - this.gameHeight / 2;
    }

    initializeRender(point: Point): void {
        if (this.is3d) {
            this.initializeRender3d(point);
        } else {
            this.initializeRender2d(point);
        }
    }

    renderGrid(gridSize: number): void {
        const context = this.contexts[RenderPass.GRID];
        context.strokeStyle = '#ffffff';

        const canvasOffsetX = this.canvasX % gridSize;
        const canvasOffsetY = this.canvasY % gridSize;

        let scaledY;
        let scaledX;

        scaledY = this.gameHeight * this.scale;
        for (let x = -canvasOffsetX; x < this.gameWidth; x +=  gridSize) {
            scaledX = x * this.scale;
            context.beginPath();
            context.moveTo(scaledX, 0);
            context.lineTo(scaledX, scaledY);
            context.stroke();
        }

        scaledX = this.gameWidth * this.scale;
        for (let y = -canvasOffsetY; y < this.gameHeight; y += gridSize) {
            scaledY = y * this.scale;
            context.beginPath();
            context.moveTo(0, scaledY);
            context.lineTo(scaledX, scaledY);
            context.stroke();
        }
    }

    getViewableMapBoundingBox(position: Point): BoundingBox | undefined {
        return {
            tl: {
                x: position.x - this.gameWidth / 2,
                y: position.y - this.gameHeight / 2,
            },
            br: {
                x: position.x + this.gameWidth / 2,
                y: position.y + this.gameHeight / 2,
            },
        };
    }

    getWorldPosition(position: Point): Point {
        return {
            x: Math.floor(position.x / this.scale),
            y: Math.floor(position.y / this.scale),
        };
    }
}
