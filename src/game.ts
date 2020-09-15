import { Sound } from "./sound"
import { Ring } from "./ring"
import utils from "../node_modules/decentraland-ecs-utils/index"

/*
  IMPORTANT: The tsconfig.json has been configured to include "node_modules/cannon/build/cannon.js"
*/

// Create base scene
const baseScene: Entity = new Entity()
baseScene.addComponent(new GLTFShape("models/baseLargeCheckered.glb"))
engine.addEntity(baseScene)

// Rings
let triggerBox = new utils.TriggerBoxShape(new Vector3(3.5, 3, 1), new Vector3(0, 0.5, 0)) // Trigger shape
const ring = new Ring(new GLTFShape("models/ring.glb"), new Vector3(40, 12, 40), 2, triggerBox)

// Create rocket
let forwardVector: Vector3 = Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector
let vectorScale: number = 250

const rocketBoard = new Entity()
rocketBoard.addComponent(new Transform({ position: new Vector3(12, 2, 12), scale: new Vector3(1, 1, 1) }))
rocketBoard.addComponent(new GLTFShape("models/rocketBoard.glb"))
engine.addEntity(rocketBoard)

const rocketFlames = new Entity()
rocketFlames.addComponent(new Transform({ scale: new Vector3(0, 0, 0) }))
rocketFlames.addComponent(new GLTFShape("models/rocketFlames.glb"))
rocketFlames.setParent(rocketBoard)

// Sounds
const rocketBoosterSound = new Sound(new AudioClip("sounds/rocketBooster.mp3"), true)

// Setup our world
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0) // m/s²
const groundMaterial = new CANNON.Material("groundMaterial")
const groundContactMaterial = new CANNON.ContactMaterial(groundMaterial, groundMaterial, { friction: 0.5, restitution: 0.33 })
world.addContactMaterial(groundContactMaterial)

// Invisible walls
//#region
const wallShape = new CANNON.Box(new CANNON.Vec3(40, 50, 0.5))
const wallNorth = new CANNON.Body({
  mass: 0,
  shape: wallShape,
  position: new CANNON.Vec3(40, 49.5, 80),
})
world.addBody(wallNorth)

const wallSouth = new CANNON.Body({
  mass: 0,
  shape: wallShape,
  position: new CANNON.Vec3(40, 49.5, 0),
})
world.addBody(wallSouth)

const wallEast = new CANNON.Body({
  mass: 0,
  shape: wallShape,
  position: new CANNON.Vec3(80, 49.5, 40),
})
wallEast.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
world.addBody(wallEast)

const wallWest = new CANNON.Body({
  mass: 0,
  shape: wallShape,
  position: new CANNON.Vec3(0, 49.5, 40),
})
wallWest.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
world.addBody(wallWest)
//#endregion

// Create a ground plane and apply physics material
const groundBody = new CANNON.Body({ mass: 0 })
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis

const groundShape: CANNON.Plane = new CANNON.Plane()
groundBody.addShape(groundShape)
groundBody.material = groundMaterial
world.addBody(groundBody)

const boxMaterial = new CANNON.Material("boxMaterial")
const boxContactMaterial = new CANNON.ContactMaterial(groundMaterial, boxMaterial, { friction: 0.4, restitution: 0 })
world.addContactMaterial(boxContactMaterial)

// Create bodies to represent each of the boxs
let boxTransform = rocketBoard.getComponent(Transform)

const boxBody: CANNON.Body = new CANNON.Body({
  mass: 5, // kg
  position: new CANNON.Vec3(boxTransform.position.x, boxTransform.position.y, boxTransform.position.z), // m
  shape: new CANNON.Box(new CANNON.Vec3(2, 0.1, 2)), // m (Create sphere shaped body with a radius of 1)
})

boxBody.material = boxMaterial // Add bouncy material to box body
boxBody.linearDamping = 0.4 // Round will keep translating even with friction so you need linearDamping
boxBody.angularDamping = 0.4 // Round bodies will keep rotating even with friction so you need angularDamping

world.addBody(boxBody) // Add body to the world

const fixedTimeStep: number = 1.0 / 60.0 // seconds
const maxSubSteps: number = 3

class updateSystem implements ISystem {
  update(dt: number): void {
    // Instruct the world to perform a single step of simulation.
    // It is generally best to keep the time step and iterations fixed.
    world.step(fixedTimeStep, dt, maxSubSteps)

    if (isFKeyPressed) {
      boxBody.applyForce(new CANNON.Vec3(0, 1 * vectorScale, 0), new CANNON.Vec3(boxBody.position.x, boxBody.position.y, boxBody.position.z))
    }

    if (isEKeyPressed) {
      boxBody.applyForce(
        new CANNON.Vec3(forwardVector.x * vectorScale, 0, forwardVector.z * vectorScale),
        new CANNON.Vec3(boxBody.position.x, boxBody.position.y, boxBody.position.z)
      )
    }

    boxBody.angularVelocity.setZero() // Prevents the board from rotating

    // Position and rotate the boxs in the scene to match their cannon world counterparts
    rocketBoard.getComponent(Transform).position.copyFrom(boxBody.position)
    forwardVector = Vector3.Forward().rotate(Camera.instance.rotation)
  }
}

engine.addSystem(new updateSystem())

// Controls (workaround to check if a button is pressed or not)
const input = Input.instance
let isEKeyPressed = false
let isFKeyPressed = false

// E Key
input.subscribe("BUTTON_DOWN", ActionButton.PRIMARY, false, () => {
  activateRocketBooster((isEKeyPressed = true))
})
input.subscribe("BUTTON_UP", ActionButton.PRIMARY, false, () => {
  isEKeyPressed = false
  if (!isFKeyPressed) {
    activateRocketBooster(false)
  }
})

// F Key
input.subscribe("BUTTON_DOWN", ActionButton.SECONDARY, false, () => {
  activateRocketBooster((isFKeyPressed = true))
})
input.subscribe("BUTTON_UP", ActionButton.SECONDARY, false, () => {
  isFKeyPressed = false
  if (!isEKeyPressed) {
    activateRocketBooster(false)
  }
})

function activateRocketBooster(isOn: boolean) {
  if (isOn) {
    rocketFlames.getComponent(Transform).scale.setAll(1)
    rocketBoosterSound.getComponent(AudioSource).playing = true
  } else {
    rocketBoosterSound.getComponent(AudioSource).playing = false
    rocketFlames.getComponent(Transform).scale.setAll(0)
  }
}
