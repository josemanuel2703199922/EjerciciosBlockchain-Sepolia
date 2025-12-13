import { expect } from "chai";
import { ethers } from "hardhat";

describe("MiContrato", function () {
    let contrato: any; 
    let owner: any; 
    let otherAccount: any; 
    const MAX_HISTORIAL = 100; 

    before(async function () {
        [owner, otherAccount] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const MiContratoFactory = await ethers.getContractFactory("MiContrato");
        // Asegúrate de usar el contrato optimizado que inicializa el historial a 100
        contrato = await MiContratoFactory.deploy();
        await contrato.waitForDeployment(); 
    });

    
    describe("Inicialización y Lectura", function () {
        
        it("Debería inicializarse con el nombre 'Nombre Inicial'", async function () {
            expect(await contrato.obtenerNombre()).to.equal("Nombre Inicial");
        });

        it("Debería inicializarse con el contador de cambios en 0", async function () {
            expect(await contrato.obtenerCambios()).to.equal(0n);
        });

        it("El tamaño inicial del historial debe ser 0 (Lógico) y 100 (Físico)", async function () {
            // EXPECTATIVA CLAVE MODIFICADA: historialSize() debe ser 0
            expect(await contrato.historialSize()).to.equal(0n); 
            
            // NUEVA EXPECTATIVA: La longitud física del array debe ser MAX_HISTORIAL (100)
            // Ya que el constructor lo inicializa a ese tamaño por optimización de gas.
            expect((await contrato.obtenerHistorial()).length).to.equal(MAX_HISTORIAL);
        });
    });
    

    describe("Función cambiarNombre", function () {
        // ... (Tests de cambiarNombre sin cambios) ...

        const nuevoNombre = "Nombre Actualizado";

        it("Debería actualizar la variable 'nombre' y el contador 'cambios'", async function () {
            await contrato.cambiarNombre(nuevoNombre);
            
            expect(await contrato.obtenerNombre()).to.equal(nuevoNombre);
            expect(await contrato.obtenerCambios()).to.equal(1n);
        });

        it("Debería revertir si el nombre está vacío", async function () {
            await expect(contrato.cambiarNombre(""))
                .to.be.revertedWith("Nombre no puede estar vacio");
        });

        it("Debería emitir el evento 'NombreCambiado' con los argumentos correctos", async function () {
            await expect(contrato.connect(otherAccount).cambiarNombre(nuevoNombre))
                .to.emit(contrato, "NombreCambiado") 
                .withArgs(nuevoNombre, otherAccount.address, (timestamp: bigint) => {
                    return timestamp > 0n; 
                });
        });
    });
    
    describe("Historial y Buffer Circular", function () {
        
        it("Debería almacenar los nombres y reportar el tamaño correcto", async function () {
            await contrato.cambiarNombre("Primero"); // Cambios = 1, Índice = 0
            await contrato.cambiarNombre("Segundo"); // Cambios = 2, Índice = 1
        
            // El tamaño lógico (historialSize) sigue siendo 2
            expect(await contrato.historialSize()).to.equal(2n);
            
            const historial = await contrato.obtenerHistorial();
            
            // EXPECTATIVA CLAVE MODIFICADA: Comprobamos el contenido usando la posición de índice.
            // Los elementos no utilizados serán una cadena vacía ("").
            expect(historial[0]).to.equal("Primero");
            expect(historial[1]).to.equal("Segundo");
            
            // Verificamos que los siguientes elementos están vacíos
            expect(historial[2]).to.equal("");
            expect(historial.length).to.equal(MAX_HISTORIAL); // La longitud física debe ser 100
        });

        // Este test ya pasaba con la versión optimizada del contrato
        it("Debería llenar el historial hasta MAX_HISTORIAL y mantener el tamaño", async function () {
            
            for (let i = 1; i <= MAX_HISTORIAL; i++) {
                await contrato.cambiarNombre(`Nombre ${i}`);
            }

            // El tamaño debe ser el máximo (100)
            expect(await contrato.historialSize()).to.equal(BigInt(MAX_HISTORIAL));
            expect((await contrato.obtenerHistorial()).length).to.equal(MAX_HISTORIAL);
            
            const historialLleno = await contrato.obtenerHistorial();
            expect(historialLleno[0]).to.equal("Nombre 1");
            expect(historialLleno[MAX_HISTORIAL - 1]).to.equal("Nombre 100");
        });

        // Este test ya pasaba con la versión optimizada del contrato
        it("Debería sobrescribir el elemento más antiguo al exceder MAX_HISTORIAL (Circular Buffer)", async function () {
            // 1. Llenar el historial (100 elementos: Nombre 1 a Nombre 100)
            for (let i = 1; i <= MAX_HISTORIAL; i++) {
                await contrato.cambiarNombre(`Nombre ${i}`);
            }

            // 2. Realizar un cambio extra (cambio 101) que fuerza la sobrescritura del "Nombre 1"
            await contrato.cambiarNombre("¡NUEVO SOBRESCRITO!"); 

            // 3. El tamaño debe seguir siendo MAX_HISTORIAL (100)
            expect(await contrato.historialSize()).to.equal(BigInt(MAX_HISTORIAL));

            // 4. Verificación del Buffer Circular
            const historialFinal = await contrato.obtenerHistorial();

            // El elemento en el índice 0 ("Nombre 1") será sobrescrito.
            expect(historialFinal[0]).to.equal("¡NUEVO SOBRESCRITO!");
            
            // El elemento en el índice 1 debe ser "Nombre 2"
            expect(historialFinal[1]).to.equal("Nombre 2");
            
            // El último elemento debe ser "Nombre 100" 
            expect(historialFinal[MAX_HISTORIAL - 1]).to.equal("Nombre 100");
            
            // Verificamos que el arreglo tiene la longitud correcta
            expect(historialFinal.length).to.equal(MAX_HISTORIAL);
        });
    });
});