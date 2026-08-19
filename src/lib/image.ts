import * as ImageManipulator from "expo-image-manipulator";

/**
 * Resize foto ke lebar maksimal 1280px dan kompres ke JPEG quality 0.5.
 * Tanpa ini, foto dari kamera HP modern bisa 4000x3000px / 5-10MB, yang sering
 * gagal terupload karena kena limit Nginx (client_max_body_size) atau PHP
 * (upload_max_filesize) di server, atau timeout di jaringan seluler.
 */
export async function compressPhoto(uri: string): Promise<{ uri: string; name: string; type: string }> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1280 } }], {
    compress: 0.5,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    name: `photo-${Date.now()}.jpg`,
    type: "image/jpeg",
  };
}
