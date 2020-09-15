import utils from "../node_modules/decentraland-ecs-utils/index"
import { ToggleState } from "../node_modules/decentraland-ecs-utils/toggle/toggleComponent"
import { TriggerBoxShape } from "../node_modules/decentraland-ecs-utils/triggers/triggerSystem"
import { Sound } from "./sound"

// Sound
const ringPass = new Sound(new AudioClip("sounds/ringPass.mp3"), false)
const EDGE_OFFSET = 6
const Y_OFFSET = 6
const GROUND_OFFSET = 10
const SCENE_SIZE = 68

export class Ring extends Entity {
  startPos: Vector3
  endPos: Vector3

  constructor(model: GLTFShape, startPos: Vector3, time: number, triggerBox: TriggerBoxShape) {
    super()
    engine.addEntity(this)
    this.addComponent(model)
    this.addComponent(new Transform({ position: startPos }))
    this.startPos = startPos
    this.endPos = new Vector3(startPos.x, startPos.y + Y_OFFSET, startPos.z)

    this.addComponent(
      new utils.TriggerComponent(triggerBox, null, null, null, null, null, () => {
        // Camera exit
        this.startPos = new Vector3(Math.random() * SCENE_SIZE + EDGE_OFFSET, Math.random() * 24 + GROUND_OFFSET, Math.random() * SCENE_SIZE + EDGE_OFFSET)
        this.endPos = new Vector3(this.startPos.x, this.startPos.y + GROUND_OFFSET, this.startPos.z)
        ringPass.getComponent(AudioSource).playOnce()
      })
    )

    // Move the platform back and forth between start and end positions
    this.addComponent(
      new utils.ToggleComponent(utils.ToggleState.Off, (value: ToggleState) => {
        if (value == utils.ToggleState.On) {
          this.addComponentOrReplace(
            new utils.MoveTransformComponent(
              this.startPos,
              this.endPos,
              time,
              () => {
                this.getComponent(utils.ToggleComponent).toggle()
              },
              utils.InterpolationType.EASEQUAD
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
              utils.InterpolationType.EASEQUAD
            )
          )
        }
      })
    )
    this.getComponent(utils.ToggleComponent).toggle()
  }
}
