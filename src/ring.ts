import * as utils from '@dcl/ecs-scene-utils'
import { Sound } from './sound'

// Sound
const ringPass = new Sound(new AudioClip('sounds/ringPass.mp3'), false)

// Config
const EDGE_OFFSET = 6
const Y_OFFSET = 8
const GROUND_OFFSET = 10
const SCENE_SIZE = 65
const MAX_HEIGHT = 20

// Creates a ring that floats up and down continuously
export class Ring extends Entity {
  startPos: Vector3
  endPos: Vector3

  constructor(model: GLTFShape, startPos: Vector3, time: number) {
    super()
    engine.addEntity(this)
    this.addComponent(model)
    this.addComponent(new Transform({ position: startPos }))
    this.startPos = startPos
    this.endPos = new Vector3(startPos.x, startPos.y + Y_OFFSET, startPos.z)

    this.addComponent(
      new utils.TriggerComponent(
        new utils.TriggerBoxShape(
          new Vector3(10, 8.5, 1),
          new Vector3(0, 1.2, 0)
        ),
        {
          onCameraExit: () => {
            // Randomly reposition the ring after player passes through the ring
            this.startPos = new Vector3(
              Math.random() * SCENE_SIZE + EDGE_OFFSET,
              Math.random() * MAX_HEIGHT + GROUND_OFFSET,
              Math.random() * SCENE_SIZE + EDGE_OFFSET
            )
            this.endPos = new Vector3(
              this.startPos.x,
              this.startPos.y + GROUND_OFFSET,
              this.startPos.z
            )
            ringPass.getComponent(AudioSource).playOnce()
          }
        }
      )
    )

    // Move the ring up and down between start and end positions
    this.addComponent(
      new utils.ToggleComponent(
        utils.ToggleState.Off,
        (value: utils.ToggleState) => {
          if (value === utils.ToggleState.On) {
            this.addComponentOrReplace(
              new utils.MoveTransformComponent(
                this.startPos,
                this.endPos,
                time,
                () => {
                  this.getComponent(utils.ToggleComponent).toggle()
                },
                utils.InterpolationType.EASEQUAD // Ease in and out
              )
            )
          } else {
            this.addComponentOrReplace(
              new utils.MoveTransformComponent(
                this.endPos,
                this.startPos,
                time,
                () => {
                  this.getComponent(utils.ToggleComponent).toggle()
                },
                utils.InterpolationType.EASEQUAD // Ease in and out
              )
            )
          }
        }
      )
    )
    this.getComponent(utils.ToggleComponent).toggle()
  }
}
