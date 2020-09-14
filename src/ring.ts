import utils from "../node_modules/decentraland-ecs-utils/index"
import { ToggleState } from "../node_modules/decentraland-ecs-utils/toggle/toggleComponent"
import { TriggerBoxShape } from "../node_modules/decentraland-ecs-utils/triggers/triggerSystem"
import { Sound } from "./sound"

// Sound
const ringPass = new Sound(new AudioClip("sounds/ringPass.mp3"), false)



export class Ring extends Entity {
  constructor(model: GLTFShape, startPos: Vector3, endPos: Vector3, time: number, triggerBox: TriggerBoxShape) {
    super()
    engine.addEntity(this)
    this.addComponent(model)
    this.addComponent(new Transform({ position: startPos }))

    this.addComponent(
      new utils.TriggerComponent(
        triggerBox, 
        null, null, null, null, null,
        () => {
          // Camera exit
          engine.removeEntity(this)
          ringPass.getComponent(AudioSource).playOnce()
        }
      )
    )

    // Move the platform back and forth between start and end positions
    this.addComponent(
      new utils.ToggleComponent(utils.ToggleState.Off, (value: ToggleState) => {
        if (value == utils.ToggleState.On) {
          this.addComponentOrReplace(
            new utils.MoveTransformComponent(startPos, endPos, time, () => {
              this.getComponent(utils.ToggleComponent).toggle()
            }, utils.InterpolationType.EASEQUAD)
          )
        } else {
          this.addComponentOrReplace(
            new utils.MoveTransformComponent(endPos, startPos, time, () => {
              this.getComponent(utils.ToggleComponent).toggle()
            }, utils.InterpolationType.EASEQUAD
            )
          )
        }
      })
    )
    this.getComponent(utils.ToggleComponent).toggle()
  }
}
