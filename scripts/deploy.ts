import { ethers } from "hardhat";

async function main() {
  // ✅ Usamos el nombre 'MiContrato'
  const MiContratoFactory = await ethers.getContractFactory("MiContrato");
  
  console.log("Desplegando MiContrato en Sepolia...");

  // Desplegamos sin argumentos (ya que no tiene constructor)
  const contrato = await MiContratoFactory.deploy();

  await contrato.waitForDeployment();
  
  const address = await contrato.getAddress();
  
  console.log(`✅ Contrato 'MiContrato' desplegado en Sepolia en: ${address}`);
  
  // Instrucción para la verificación (no hay argumentos de constructor)
  console.log(`\n--- VERIFICACIÓN ---`);
  console.log(`npx hardhat verify --network sepolia ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});