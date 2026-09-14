#include <CoreFoundation/CoreFoundation.h>
#include <IOKit/IOKitLib.h>
#include <IOKit/IOCFPlugIn.h>
#include <IOKit/usb/IOUSBLib.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int leggiNumero(
    io_service_t service,
    CFStringRef key,
    int *valore
) {
    CFTypeRef value =
        IORegistryEntryCreateCFProperty(
            service,
            key,
            kCFAllocatorDefault,
            0
        );

    if (!value) {
        return 0;
    }

    int ok = 0;

    if (
        CFGetTypeID(value) ==
        CFNumberGetTypeID()
    ) {
        ok = CFNumberGetValue(
            (CFNumberRef)value,
            kCFNumberIntType,
            valore
        );
    }

    CFRelease(value);

    return ok;
}

static void leggiStringa(
    io_service_t service,
    CFStringRef key,
    char *buffer,
    size_t dimensione
) {
    if (!buffer || dimensione == 0) {
        return;
    }

    buffer[0] = '\0';

    CFTypeRef value =
        IORegistryEntryCreateCFProperty(
            service,
            key,
            kCFAllocatorDefault,
            0
        );

    if (!value) {
        return;
    }

    if (
        CFGetTypeID(value) ==
        CFStringGetTypeID()
    ) {
        CFStringGetCString(
            (CFStringRef)value,
            buffer,
            dimensione,
            kCFStringEncodingUTF8
        );
    }

    CFRelease(value);
}

static void pulisciCampo(char *testo) {
    if (!testo) {
        return;
    }

    for (
        size_t i = 0;
        testo[i] != '\0';
        i++
    ) {
        if (
            testo[i] == '\t' ||
            testo[i] == '\r' ||
            testo[i] == '\n'
        ) {
            testo[i] = ' ';
        }
    }
}

static int trovaParentDispositivo(
    io_service_t interfaceService,
    io_registry_entry_t *device
) {
    io_registry_entry_t parent =
        IO_OBJECT_NULL;

    kern_return_t kr =
        IORegistryEntryGetParentEntry(
            interfaceService,
            kIOServicePlane,
            &parent
        );

    if (
        kr != KERN_SUCCESS ||
        parent == IO_OBJECT_NULL
    ) {
        return 0;
    }

    *device = parent;

    return 1;
}

static int trovaPipeBulk(
    IOUSBInterfaceInterface **usb,
    int *pipeOut,
    int *pipeIn
) {
    UInt8 numEndpoints = 0;

    IOReturn risultato =
        (*usb)->GetNumEndpoints(
            usb,
            &numEndpoints
        );

    if (
        risultato !=
        kIOReturnSuccess
    ) {
        return 0;
    }

    *pipeOut = 0;
    *pipeIn = 0;

    for (
        UInt8 pipe = 1;
        pipe <= numEndpoints;
        pipe++
    ) {
        UInt8 direction = 0;
        UInt8 number = 0;
        UInt8 transferType = 0;
        UInt16 maxPacketSize = 0;
        UInt8 interval = 0;

        risultato =
            (*usb)->GetPipeProperties(
                usb,
                pipe,
                &direction,
                &number,
                &transferType,
                &maxPacketSize,
                &interval
            );

        if (
            risultato !=
            kIOReturnSuccess
        ) {
            continue;
        }

        if (
            transferType ==
                kUSBBulk &&
            direction ==
                kUSBOut
        ) {
            *pipeOut = pipe;
        }

        if (
            transferType ==
                kUSBBulk &&
            direction ==
                kUSBIn
        ) {
            *pipeIn = pipe;
        }
    }

    return *pipeOut > 0;
}

static int creaInterfaccia(
    io_service_t service,
    IOUSBInterfaceInterface ***usb
) {
    IOCFPlugInInterface **plugin =
        NULL;

    SInt32 score = 0;

    kern_return_t kr =
        IOCreatePlugInInterfaceForService(
            service,
            kIOUSBInterfaceUserClientTypeID,
            kIOCFPlugInInterfaceID,
            &plugin,
            &score
        );

    if (
        kr != KERN_SUCCESS ||
        !plugin
    ) {
        return 0;
    }

    HRESULT queryResult =
        (*plugin)->QueryInterface(
            plugin,
            CFUUIDGetUUIDBytes(
                kIOUSBInterfaceInterfaceID
            ),
            (LPVOID *)usb
        );

    IODestroyPlugInInterface(plugin);

    if (
        queryResult ||
        !*usb
    ) {
        return 0;
    }

    return 1;
}

static int elencaStampanti(void) {
    io_iterator_t iter =
        IO_OBJECT_NULL;

    CFMutableDictionaryRef matching =
        IOServiceMatching(
            "AppleUSBInterface"
        );

    if (!matching) {
        fprintf(
            stderr,
            "ERRORE matching AppleUSBInterface\n"
        );

        return 1;
    }

    kern_return_t kr =
        IOServiceGetMatchingServices(
            kIOMasterPortDefault,
            matching,
            &iter
        );

    if (kr != KERN_SUCCESS) {
        fprintf(
            stderr,
            "ERRORE ricerca USB: 0x%08x\n",
            kr
        );

        return 2;
    }

    io_service_t service;

    while (
        (service = IOIteratorNext(iter))
    ) {
        int vendor = -1;
        int product = -1;
        int interfaceNumber = -1;

        leggiNumero(
            service,
            CFSTR("idVendor"),
            &vendor
        );

        leggiNumero(
            service,
            CFSTR("idProduct"),
            &product
        );

        leggiNumero(
            service,
            CFSTR("bInterfaceNumber"),
            &interfaceNumber
        );

        if (vendor != 0x04b8) {
            IOObjectRelease(service);
            continue;
        }

        io_registry_entry_t device =
            IO_OBJECT_NULL;

        char nome[256] = "";
        char seriale[256] = "";

        if (
            trovaParentDispositivo(
                service,
                &device
            )
        ) {
            leggiStringa(
                device,
                CFSTR("USB Product Name"),
                nome,
                sizeof(nome)
            );

            leggiStringa(
                device,
                CFSTR("USB Serial Number"),
                seriale,
                sizeof(seriale)
            );
        }

        if (
            nome[0] != '\0' &&
            strncmp(
                nome,
                "TM-",
                3
            ) != 0
        ) {
            if (
                device !=
                IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        IOUSBInterfaceInterface **usb =
            NULL;

        if (
            !creaInterfaccia(
                service,
                &usb
            )
        ) {
            if (
                device !=
                IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        IOReturn openResult =
            (*usb)->USBInterfaceOpen(
                usb
            );

        if (
            openResult !=
            kIOReturnSuccess
        ) {
            (*usb)->Release(usb);

            if (
                device !=
                IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        int pipeOut = 0;
        int pipeIn = 0;

        trovaPipeBulk(
            usb,
            &pipeOut,
            &pipeIn
        );

        (*usb)->USBInterfaceClose(
            usb
        );

        (*usb)->Release(usb);

        if (pipeOut > 0) {
            pulisciCampo(nome);
            pulisciCampo(seriale);

            printf(
                "EPSON_POS\t"
                "%s\t"
                "%04x\t"
                "%04x\t"
                "%s\t"
                "%d\t"
                "%d\t"
                "%d\n",
                nome[0]
                    ? nome
                    : "EPSON TM",
                vendor,
                product,
                seriale,
                interfaceNumber,
                pipeOut,
                pipeIn
            );
        }

        if (
            device !=
            IO_OBJECT_NULL
        ) {
            IOObjectRelease(device);
        }

        IOObjectRelease(service);
    }

    IOObjectRelease(iter);

    return 0;
}

static unsigned char *leggiStdin(
    size_t *dimensione
) {
    size_t capacita = 4096;
    size_t usati = 0;

    unsigned char *buffer =
        malloc(capacita);

    if (!buffer) {
        return NULL;
    }

    while (1) {
        if (
            capacita - usati <
            2048
        ) {
            size_t nuovaCapacita =
                capacita * 2;

            unsigned char *nuovo =
                realloc(
                    buffer,
                    nuovaCapacita
                );

            if (!nuovo) {
                free(buffer);
                return NULL;
            }

            buffer = nuovo;
            capacita = nuovaCapacita;
        }

        size_t letti =
            fread(
                buffer + usati,
                1,
                capacita - usati,
                stdin
            );

        usati += letti;

        if (letti == 0) {
            if (ferror(stdin)) {
                free(buffer);
                return NULL;
            }

            break;
        }
    }

    *dimensione = usati;

    return buffer;
}

static int scriviStampante(
    int vendorCercato,
    int productCercato,
    const char *serialeCercato,
    int interfacciaCercata
) {
    size_t dimensione = 0;

    unsigned char *dati =
        leggiStdin(
            &dimensione
        );

    if (!dati) {
        fprintf(
            stderr,
            "ERRORE lettura dati da stdin\n"
        );

        return 20;
    }

    if (dimensione == 0) {
        free(dati);

        fprintf(
            stderr,
            "ERRORE contenuto vuoto\n"
        );

        return 21;
    }

    io_iterator_t iter =
        IO_OBJECT_NULL;

    CFMutableDictionaryRef matching =
        IOServiceMatching(
            "AppleUSBInterface"
        );

    if (!matching) {
        free(dati);
        return 22;
    }

    kern_return_t kr =
        IOServiceGetMatchingServices(
            kIOMasterPortDefault,
            matching,
            &iter
        );

    if (kr != KERN_SUCCESS) {
        free(dati);
        return 23;
    }

    io_service_t service;

    int trovata = 0;
    int risultatoFinale = 24;

    while (
        (service = IOIteratorNext(iter))
    ) {
        int vendor = -1;
        int product = -1;
        int interfaceNumber = -1;

        leggiNumero(
            service,
            CFSTR("idVendor"),
            &vendor
        );

        leggiNumero(
            service,
            CFSTR("idProduct"),
            &product
        );

        leggiNumero(
            service,
            CFSTR("bInterfaceNumber"),
            &interfaceNumber
        );

        if (
            vendor != vendorCercato ||
            product != productCercato ||
            interfaceNumber !=
                interfacciaCercata
        ) {
            IOObjectRelease(service);
            continue;
        }

        io_registry_entry_t device =
            IO_OBJECT_NULL;

        char seriale[256] = "";

        if (
            trovaParentDispositivo(
                service,
                &device
            )
        ) {
            leggiStringa(
                device,
                CFSTR("USB Serial Number"),
                seriale,
                sizeof(seriale)
            );
        }

        if (
            serialeCercato &&
            serialeCercato[0] != '\0' &&
            strcmp(
                seriale,
                serialeCercato
            ) != 0
        ) {
            if (
                device !=
                IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        trovata = 1;

        IOUSBInterfaceInterface **usb =
            NULL;

        if (
            !creaInterfaccia(
                service,
                &usb
            )
        ) {
            risultatoFinale = 25;
        } else {
            IOReturn openResult =
                (*usb)->USBInterfaceOpen(
                    usb
                );

            if (
                openResult !=
                kIOReturnSuccess
            ) {
                fprintf(
                    stderr,
                    "ERRORE apertura USB: 0x%08x\n",
                    openResult
                );

                risultatoFinale = 26;
            } else {
                int pipeOut = 0;
                int pipeIn = 0;

                if (
                    !trovaPipeBulk(
                        usb,
                        &pipeOut,
                        &pipeIn
                    )
                ) {
                    fprintf(
                        stderr,
                        "ERRORE pipe BULK OUT non trovata\n"
                    );

                    risultatoFinale = 27;
                } else {
                    size_t offset = 0;

                    risultatoFinale = 0;

                    while (
                        offset <
                        dimensione
                    ) {
                        size_t restante =
                            dimensione -
                            offset;

                        UInt32 blocco =
                            restante > 4096
                                ? 4096
                                : (UInt32)restante;

                        IOReturn writeResult =
                            (*usb)->WritePipe(
                                usb,
                                (UInt8)pipeOut,
                                dati + offset,
                                blocco
                            );

                        if (
                            writeResult !=
                            kIOReturnSuccess
                        ) {
                            fprintf(
                                stderr,
                                "ERRORE WritePipe: 0x%08x\n",
                                writeResult
                            );

                            risultatoFinale =
                                28;

                            break;
                        }

                        offset += blocco;
                    }

                    if (
                        risultatoFinale ==
                        0
                    ) {
                        printf(
                            "USB_WRITE_OK\t%lu\n",
                            (unsigned long)
                                dimensione
                        );
                    }
                }

                (*usb)->USBInterfaceClose(
                    usb
                );
            }

            (*usb)->Release(usb);
        }

        if (
            device !=
            IO_OBJECT_NULL
        ) {
            IOObjectRelease(device);
        }

        IOObjectRelease(service);

        break;
    }

    IOObjectRelease(iter);
    free(dati);

    if (!trovata) {
        fprintf(
            stderr,
            "ERRORE stampante USB richiesta non trovata\n"
        );

        return 29;
    }

    return risultatoFinale;
}

int main(
    int argc,
    char **argv
) {
    if (
        argc == 2 &&
        strcmp(
            argv[1],
            "--list"
        ) == 0
    ) {
        return elencaStampanti();
    }

    if (
        argc == 6 &&
        strcmp(
            argv[1],
            "--write"
        ) == 0
    ) {
        int vendor =
            (int)strtol(
                argv[2],
                NULL,
                16
            );

        int product =
            (int)strtol(
                argv[3],
                NULL,
                16
            );

        const char *seriale =
            argv[4];

        int interfaccia =
            atoi(
                argv[5]
            );

        return scriviStampante(
            vendor,
            product,
            seriale,
            interfaccia
        );
    }

    fprintf(
        stderr,
        "Uso:\n"
        "  %s --list\n"
        "  %s --write VENDOR PRODUCT SERIALE INTERFACCIA\n",
        argv[0],
        argv[0]
    );

    return 64;
}
