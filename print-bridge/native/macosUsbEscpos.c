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
            "ERRORE ricerca interfacce USB: 0x%08x\n",
            kr
        );
        return 2;
    }

    io_service_t service;
    int trovate = 0;

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

        /*
         * Per ora consideriamo soltanto
         * dispositivi Epson.
         */
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

        /*
         * Stampanti POS Epson TM-*.
         */
        if (
            nome[0] != '\0' &&
            strncmp(nome, "TM-", 3) != 0
        ) {
            if (
                device != IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        IOCFPlugInInterface **plugin =
            NULL;

        IOUSBInterfaceInterface **usb =
            NULL;

        SInt32 score = 0;

        kr =
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
            if (
                device != IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        HRESULT queryResult =
            (*plugin)->QueryInterface(
                plugin,
                CFUUIDGetUUIDBytes(
                    kIOUSBInterfaceInterfaceID
                ),
                (LPVOID *)&usb
            );

        IODestroyPlugInInterface(plugin);

        if (
            queryResult ||
            !usb
        ) {
            if (
                device != IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        UInt8 numEndpoints = 0;

        (*usb)->GetNumEndpoints(
            usb,
            &numEndpoints
        );

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
                device != IO_OBJECT_NULL
            ) {
                IOObjectRelease(device);
            }

            IOObjectRelease(service);
            continue;
        }

        int pipeOut = 0;
        int pipeIn = 0;

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

            IOReturn risultato =
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
                pipeOut = pipe;
            }

            if (
                transferType ==
                    kUSBBulk &&
                direction ==
                    kUSBIn
            ) {
                pipeIn = pipe;
            }
        }

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

            trovate++;
        }

        if (
            device != IO_OBJECT_NULL
        ) {
            IOObjectRelease(device);
        }

        IOObjectRelease(service);
    }

    IOObjectRelease(iter);

    return trovate >= 0
        ? 0
        : 3;
}

int main(int argc, char **argv) {
    if (
        argc == 2 &&
        strcmp(
            argv[1],
            "--list"
        ) == 0
    ) {
        return elencaStampanti();
    }

    fprintf(
        stderr,
        "Uso: %s --list\n",
        argv[0]
    );

    return 64;
}
