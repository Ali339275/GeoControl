import sensorRoutes from "./sensorRoutes";

router.use("/api/v1/networks/:networkCode/gateways/:gatewayMac/sensors", sensorRoutes);