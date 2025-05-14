import AppError from "@models/errors/AppError";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { BadRequestError } from "@models/errors/BadRequestError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  getAllNetworks,
  createNetwork,
  getNetwork,
  deleteNetwork,
  updateNetwork
} from "@controllers/networkController";
import { NetworkFromJSON } from "@dto/Network";


const router = Router();

// Get all networks (Any authenticated user)
router.get("", authenticateUser(), async (req, res, next) => {
  try {
    if(!req.body.name){
      throw new BadRequestError(" /body/name must have required property name")
    }
    if(!req.body.code){
      throw new BadRequestError(" /body/code must have required property code")
    }
    if(!req.body.description){
      throw new BadRequestError(" /body/description must have required property description")
    }

    res.status(200).json(await getAllNetworks());
  } catch (error) {
    next(error);
  }
});

// Create a new network (Admin & Operator)
router.post("",authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try{
    await createNetwork(NetworkFromJSON(req.body));
    res.status(201).send();
  }
  catch(error){
    next(error);
  }
});

// Get a specific network (Any authenticated user)
router.get("/:networkCode", authenticateUser(), async (req, res, next) => {
  try{
    res.status(200).json(await getNetwork(req.params.networkCode));
  }
  catch (error){
    next(error);
  }
});

// Update a network (Admin & Operator)
router.patch("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async(req, res, next) => {
  try {

    if(!req.body.name){
      throw new BadRequestError("/body/name must have required property name")
    }
    if(!req.body.code){
      throw new BadRequestError("/body/code must have required property code")
    }
    if(!req.body.description){
      throw new BadRequestError("/body/description must have required property description")
    }

    const code = req.params.networkCode;
    const networkDto = NetworkFromJSON(req.body);
    await updateNetwork(code, networkDto);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a network (Admin & Operator)
router.delete("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async(req, res, next) => {
  try{
    await deleteNetwork(req.params.networkCode)
    res.status(204).send();
  }
  catch (error){
    next(error);
  }
});

export default router;
